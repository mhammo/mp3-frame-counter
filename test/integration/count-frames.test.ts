import { createReadStream } from "node:fs";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import axios from "axios";
import FormData from "form-data";
import { test, expect, afterAll, beforeAll } from "vitest";
import { startWebServer, stopWebServer } from "../../api/server";
import { initConfigProvider } from "../../lib/config";

let addressInfo: AddressInfo | null;

beforeAll(async () => {
  // Use an ephemeral port value.
  initConfigProvider({ PORT: "0" });
  addressInfo = await startWebServer();
});

afterAll(async () => {
  await stopWebServer();
});

test("counts the frames", async () => {
  const mp3FileStream = await createReadStream(
    join(__dirname, "../fixtures/audio-without-info.mp3"),
  );

  const formData = new FormData();
  formData.append("document", mp3FileStream);

  const response = await axios.post(
    `http://${addressInfo?.address}:${addressInfo?.port}/file-upload`,
    formData,
  );

  expect(response.status).toEqual(200);
  expect(response.data.frameCount).toEqual(6089);
});

test("returns an error for invalid mp3 version", async () => {
  const mp3FileStream = await createReadStream(
    join(__dirname, "../fixtures/audio-invalid-version.mp3"),
  );

  const formData = new FormData();
  formData.append("document", mp3FileStream);

  const response = await axios.post(
    `http://${addressInfo?.address}:${addressInfo?.port}/file-upload`,
    formData,
    {
      validateStatus: () => true,
    },
  );

  expect(response.status).toEqual(400);
  expect(response.data.message).toEqual(
    "The document is not a valid MPEG Version 1 Layer III file.",
  );
});

test("returns an error for invalid mime type", async () => {
  const mp3FileStream = await createReadStream(
    join(__dirname, "../fixtures/invalid-mime-type.png"),
  );

  const formData = new FormData();
  formData.append("document", mp3FileStream);

  const response = await axios.post(
    `http://${addressInfo?.address}:${addressInfo?.port}/file-upload`,
    formData,
    {
      validateStatus: () => true,
    },
  );

  expect(response.status).toEqual(400);
  expect(response.data.message).toEqual(
    "Only MPEG Version 1 Layer III files are supported.",
  );
});
