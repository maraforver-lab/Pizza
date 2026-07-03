export async function downloadShoppingListImage(element: HTMLElement, filename = "doughtools-shopping-list.png") {
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(element, {
    backgroundColor: "#FFF8F1",
    cacheBust: true,
    pixelRatio: 1,
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
