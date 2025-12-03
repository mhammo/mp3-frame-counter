import { test, expect } from "vitest";
import { countMp3Frames } from "./mp3-frame-counter";
import { join } from "node:path";
import { createReadStream } from "node:fs";
import { AppError } from "../lib/error-handling";

// These tests are validated using mediainfo frame counts:
// https://mediaarea.net/en/MediaInfo

test("counts the frames", async () => {
  const mp3FileStream = await createReadStream(
    join(__dirname, "../test/fixtures/audio-without-info.mp3"),
  );

  const frameCount = await countMp3Frames(mp3FileStream);

  expect(frameCount).toEqual(6089);
});

test("does not count Xing/Info header", async () => {
  const mp3FileStream = await createReadStream(
    join(__dirname, "../test/fixtures/audio-with-info.mp3"),
  );

  const frameCount = await countMp3Frames(mp3FileStream);

  expect(frameCount).toEqual(210);
});

test("rejects MP3 with invalid version", async () => {
  const mp3FileStream = await createReadStream(
    join(__dirname, "../test/fixtures/audio-invalid-version.mp3"),
  );

  const promise = countMp3Frames(mp3FileStream);

  await expect(promise).rejects.toBeInstanceOf(AppError);
  try {
    await promise;
  } catch (err) {
    const appErr = err as AppError;
    expect(appErr.message).toEqual(
      "document is not a valid MPEG Version 1 Layer III file",
    );
  }
});
