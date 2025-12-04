import { Readable } from "stream";
import { AppError, ErrorCodes } from "../lib/error-handling";
import { logger } from "../lib/monitoring";

// Tables for resolving bitrates and sample rates from
// mp3 frame headers.
const BITRATES = [
  0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0,
].map((x) => x * 1000);

const SAMPLE_RATES = [44100, 48000, 32000, 0];

const ID3_HEADER_SIZE = 10;

const MPEG_FRAME_HEADER_SIZE = 4;

const VBR_HEADER_SIZE = 12;

const CHANNEL_MODE_MONO = 3;

export async function countMp3Frames(stream: Readable): Promise<number> {
  return new Promise((resolve, reject) => {
    let pending = Buffer.alloc(0);
    let pos = 0;
    let vbrOffset = 0;
    let skipBytes = 0;
    let expectingVBRHeader = false;
    let frameCount = 0;

    stream.on("data", (chunk) => {
      pending = Buffer.concat([pending, chunk]);

      // Skip ID3v2 Tag.
      if (pos === 0 && pending.length >= ID3_HEADER_SIZE) {
        if (pending.subarray(0, 3).toString() === "ID3") {
          const id3TagSize = readSyncSafeInteger(pending.subarray(6, 10));
          skipBytes = ID3_HEADER_SIZE + id3TagSize;

          if (pending.length < skipBytes) return; // wait for more bytes

          logger.debug(`skipping ID3 tag, detected as ${skipBytes} bytes`);

          pending = pending.subarray(skipBytes);
          pos += skipBytes;
        }
      }

      // Validate first frame header and get the channel for the VBR offset.
      if (pos === skipBytes && pending.length >= MPEG_FRAME_HEADER_SIZE) {
        const frameHeader = pending.readUInt32BE(0);
        const appErr = validateFrameHeader(frameHeader);
        if (appErr) {
          reject(appErr);
          stream.destroy();
          return;
        }

        logger.debug("validated first frame header successfully");

        vbrOffset = getVbrOffset(frameHeader);
        expectingVBRHeader = true;
      }

      // Check for and skip VBR header.
      if (expectingVBRHeader) {
        if (pending.length >= vbrOffset + VBR_HEADER_SIZE) {
          const vb = pending.subarray(vbrOffset);
          const tag = vb.subarray(0, 4).toString();

          if (tag === "Xing" || tag === "Info") {
            // TODO: The frame count in the VBR header seems to have 1 extra frame in comparison to mediainfo,
            // so I'm not relying on this.
            //
            // I'm guessing mediainfo filters out non-audio metadata... it'd need further investigation but it
            // isn't strictly neccessary for the task.

            // const flags = vb.readUInt32BE(4);
            // if (flags & 0x01) {
            //   const frameCount = vb.readUInt32BE(8);

            //   logger.debug("Xing/INFO frame count found, skipping manual frame count")
            //   resolve(frameCount);
            //   stream.destroy();
            //   return;
            // }

            const frameHeader = pending.readUInt32BE(0);
            const frameLength = getFrameLength(frameHeader);

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

      // Loop through all audio frames in this chunk.
      while (pending.length >= MPEG_FRAME_HEADER_SIZE) {
        const frameHeader = pending.readUInt32BE(0);

        // Stop if the frame header is invalid, may be metadata.
        //
        // TODO: investigate how metadata frames are appended.
        // We may want to reject here instead?
        if (validateFrameHeader(frameHeader) !== null) {
          resolve(frameCount);
          stream.destroy();
          return;
        }

        const frameLength = getFrameLength(frameHeader);

        // Wait for more data.
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

/**
 * Validates that a frame has a valid MPEG Version 1 Layer III header
 * See another example here: https://chromium.googlesource.com/experimental/chromium/src/+/37.0.2057.4/media/formats/mpeg/mp3_stream_parser.cc
 */
function validateFrameHeader(frameHeader: number): Error | null {
  const sync = (frameHeader >>> 21) & 0x7ff;
  const version = (frameHeader >>> 19) & 0x3;
  const layer = (frameHeader >>> 17) & 0x3;

  if (sync !== 0x7ff || version !== 3 || layer !== 1) {
    logger.warn("unable to find a valid MPEG Version 1 Layer III frame header");

    return new AppError({
      message: "The document is not a valid MPEG Version 1 Layer III file.",
      code: ErrorCodes.invalid_request,
      parameter: "document",
    });
  }

  return null;
}

/**
 * This gets the channel from the frame header, which we can use to determine
 * the "side info" size based on whether it's mono or stereo. This gives us
 * the starting offset for the VBR header.
 */
function getVbrOffset(frameHeader: number): number {
  const channelMode = (frameHeader >>> 6) & 0x3;
  const sideInfoSize = channelMode === CHANNEL_MODE_MONO ? 17 : 32;
  return sideInfoSize + MPEG_FRAME_HEADER_SIZE;
}

/**
 * Gets the size of the frame from the MPEG frame header.
 */
function getFrameLength(frameHeader: number): number {
  const brIdx = (frameHeader >>> 12) & 0xf;
  const srIdx = (frameHeader >>> 10) & 0x3;
  const padding = (frameHeader >>> 9) & 0x1;
  const br = BITRATES[brIdx];
  const sr = SAMPLE_RATES[srIdx];
  return Math.floor((144 * br) / sr) + padding;
}
