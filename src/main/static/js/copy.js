const copyButton = document.getElementById("copyButton");

copyButton?.addEventListener("click", () => {
    navigator.clipboard.writeText(document.getElementById("shortenedUrlInput").value);
    copyButton.value = "Copied";
});
