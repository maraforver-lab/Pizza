const INVITATION_EXPORT_WIDTH = 1080;
const INVITATION_EXPORT_HEIGHT = 1350;
const A4_WIDTH_POINTS = 595.28;
const A4_HEIGHT_POINTS = 841.89;
const A4_MARGIN_POINTS = 32;

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

function dataUrlToBytes(dataUrl: string) {
  const [, base64 = ""] = dataUrl.split(",");
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function encodeText(value: string) {
  return new TextEncoder().encode(value);
}

function concatBytes(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function pdfObject(id: number, body: string | Uint8Array) {
  const prefix = encodeText(`${id} 0 obj\n`);
  const suffix = encodeText("\nendobj\n");
  const bodyBytes = typeof body === "string" ? encodeText(body) : body;
  return concatBytes([prefix, bodyBytes, suffix]);
}

function buildJpegInvitationPdf(jpegBytes: Uint8Array) {
  const availableWidth = A4_WIDTH_POINTS - (A4_MARGIN_POINTS * 2);
  const availableHeight = A4_HEIGHT_POINTS - (A4_MARGIN_POINTS * 2);
  const imageRatio = INVITATION_EXPORT_WIDTH / INVITATION_EXPORT_HEIGHT;
  const availableRatio = availableWidth / availableHeight;
  const drawWidth = imageRatio > availableRatio ? availableWidth : availableHeight * imageRatio;
  const drawHeight = imageRatio > availableRatio ? availableWidth / imageRatio : availableHeight;
  const x = (A4_WIDTH_POINTS - drawWidth) / 2;
  const y = (A4_HEIGHT_POINTS - drawHeight) / 2;
  const drawCommand = `q\n${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Invite Do\nQ`;
  const imageStream = concatBytes([
    encodeText(`<< /Type /XObject /Subtype /Image /Width ${INVITATION_EXPORT_WIDTH} /Height ${INVITATION_EXPORT_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`),
    jpegBytes,
    encodeText("\nendstream"),
  ]);
  const contentBytes = encodeText(drawCommand);
  const objects = [
    pdfObject(1, "<< /Type /Catalog /Pages 2 0 R >>"),
    pdfObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    pdfObject(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_WIDTH_POINTS} ${A4_HEIGHT_POINTS}] /Resources << /XObject << /Invite 4 0 R >> >> /Contents 5 0 R >>`),
    pdfObject(4, imageStream),
    pdfObject(5, concatBytes([
      encodeText(`<< /Length ${contentBytes.length} >>\nstream\n`),
      contentBytes,
      encodeText("\nendstream"),
    ])),
  ];

  const header = encodeText("%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n");
  const chunks = [header];
  const offsets = [0];
  let offset = header.length;
  for (const object of objects) {
    offsets.push(offset);
    chunks.push(object);
    offset += object.length;
  }

  const xrefOffset = offset;
  const xrefRows = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((value) => `${String(value).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
  ].join("\n");
  chunks.push(encodeText(xrefRows));

  return new Blob([concatBytes(chunks)], { type: "application/pdf" });
}

export async function downloadPartyOrderInvitationImage(
  element: HTMLElement,
  filename = "doughtools-party-invitation.png",
) {
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(element, {
    backgroundColor: "#20251f",
    cacheBust: true,
    height: INVITATION_EXPORT_HEIGHT,
    pixelRatio: 1,
    width: INVITATION_EXPORT_WIDTH,
  });
  downloadDataUrl(dataUrl, filename);
}

export async function downloadPartyOrderInvitationPdf(
  element: HTMLElement,
  filename = "doughtools-party-invitation.pdf",
) {
  const { toJpeg } = await import("html-to-image");
  const dataUrl = await toJpeg(element, {
    backgroundColor: "#20251f",
    cacheBust: true,
    height: INVITATION_EXPORT_HEIGHT,
    pixelRatio: 1,
    quality: 0.94,
    width: INVITATION_EXPORT_WIDTH,
  });
  const pdf = buildJpegInvitationPdf(dataUrlToBytes(dataUrl));
  const url = URL.createObjectURL(pdf);
  try {
    downloadDataUrl(url, filename);
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
