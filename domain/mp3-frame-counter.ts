import { Readable } from "stream";
import { AppError, ErrorCodes } from "../lib/error-handling";
import { logger } from "../lib/monitoring";

// Tables for resolving bitrates and sample rates from
// mp3 frame headers.
const BITRATES = [
  0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0,
].map((x) => x * 1000);

const SAMPLE_RATES = [44100, 48000, 32000, 0];

/**
 * Reads the sync-safe integer to find out the size of the ID3v2 tag, see: https://stackoverflow.com/a/5652842
 */
function readSyncSafeInteger(b: Buffer): number {
  return (
    ((b[0] & 0x7f) << 21) |
    ((b[1] & 0x7f) << 14) |
    ((b[2] & 0x7f) << 7) |
    (b[3] & 0x7f)
  );
}

function validateFrameHeader(header: number): Error | null {
  const sync = (header >>> 21) & 0x7ff;
  const version = (header >>> 19) & 0x3;
  const layer = (header >>> 17) & 0x3;

  if (sync !== 0x7ff || version !== 3 || layer !== 1) {
    logger.warn("unable to find a valid MPEG Version 1 Layer III frame header");

    return new AppError({
      message: "document is not a valid MPEG Version 1 Layer III file",
      code: ErrorCodes.invalid_request,
      parameter: "document",
    });
  }

  return null;
}

export async function countMp3Frames(stream: Readable): Promise<number> {
  return new Promise((resolve, reject) => {
    let pending = Buffer.alloc(0);
    let pos = 0;

    let channelMode = 0;
    let skipBytes = 0;

    let expectingVBRHeader = false;
    let frameCount = 0;

    stream.on("data", (chunk) => {
      pending = Buffer.concat([pending, chunk]);

      //
      // 1. Skip ID3v2 Tag
      //
      if (pos === 0 && pending.length >= 10) {
        if (pending.subarray(0, 3).toString() === "ID3") {
          const size = readSyncSafeInteger(pending.subarray(6, 10));
          skipBytes = 10 + size;

          if (pending.length < skipBytes) return; // wait for more bytes

          logger.debug(`skipping ID3 tag, detected as ${skipBytes} bytes`);

          pending = pending.subarray(skipBytes);
          pos += skipBytes;
        }
      }

      //
      // 2. Validate First Frame Header
      //
      if (pos === skipBytes && pending.length >= 4) {
        const header = pending.readUInt32BE(0);
        const appErr = validateFrameHeader(header);
        if (appErr) {
          reject(appErr);
          stream.destroy();
          return;
        }

        logger.debug("validated first frame header successfully");

        channelMode = (header >>> 6) & 0x3;
        expectingVBRHeader = true;
      }

      //
      // 3. Check for Xing/Info VBR Header
      //
      if (expectingVBRHeader) {
        const vbrOffset = (channelMode === 3 ? 17 : 32) + 4;
        const required = vbrOffset + 12;

        if (pending.length >= required) {
          const vb = pending.subarray(4 + (channelMode === 3 ? 17 : 32));
          const tag = vb.subarray(0, 4).toString();

          if (tag === "Xing" || tag === "Info") {
            // TODO: The Xing/Info header seems to have 1 extra frame in it's count in comparison to mediainfo,
            // so I'm not relying on this for now.
            //
            // It might be that we can just subtract one and return the frame count (assuming that it's counting
            // metadata that mediainfo skips)... but it'd need further investigation and isn't neccessary for the task.

            // const flags = vb.readUInt32BE(4);
            // if (flags & 0x01) {
            //   const frameCount = vb.readUInt32BE(8);

            //   logger.debug("Xing/INFO frame count found, skipping manual frame count")
            //   resolve(frameCount);
            //   stream.destroy();
            //   return;
            // }

            // Skip the Xing/Info frame.
            const firstFrameHeader = pending.readUInt32BE(0);
            const brIdx = (firstFrameHeader >>> 12) & 0xf;
            const srIdx = (firstFrameHeader >>> 10) & 0x3;
            const padding = (firstFrameHeader >>> 9) & 0x1;
            const br = BITRATES[brIdx];
            const sr = SAMPLE_RATES[srIdx];
            const frameLength = Math.floor((144 * br) / sr) + padding;

            logger.debug(
              `skipping Xing/INFO frame, detected as ${frameLength} bytes`,
            );

            pending = pending.subarray(frameLength);
            pos += frameLength;
          }

          expectingVBRHeader = false;
        } else {
          return; // wait for more data
        }
      }

      //
      // 4. Frame-by-frame scan
      //
      while (pending.length >= 4) {
        const header = pending.readUInt32BE(0);
        const appErr = validateFrameHeader(header);

        // Stop if header is invalid, may be metadata.
        //
        // TODO: investigate how metadata frames are appended.
        // We may want to reject here instead.
        if (appErr) {
          resolve(frameCount);
          stream.destroy();
          return;
        }

        const bitrateIdx = (header >>> 12) & 0xf;
        const samplerateIdx = (header >>> 10) & 0x3;
        const padding = (header >>> 9) & 1;

        const bitrate = BITRATES[bitrateIdx];
        const samplerate = SAMPLE_RATES[samplerateIdx];

        // Invalid frame or metadata.
        if (!bitrate || !samplerate) {
          resolve(frameCount);
          stream.destroy();
          return;
        }

        const frameLength = Math.floor((144 * bitrate) / samplerate) + padding;

        // Not enough data to complete frame yet
        if (pending.length < frameLength) break;

        pending = pending.subarray(frameLength);
        pos += frameLength;
        frameCount++;
      }
    });

    stream.on("end", () => {
      resolve(frameCount);
    });

    stream.on("error", reject);
  });
}
