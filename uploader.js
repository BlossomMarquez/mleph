import { supabase } from "./supabaseClient.js";
import { createFigure } from "./gallery.js";
import { sanitize } from "./utils.js";

const MAX_DISPLAY_NAME = 20;

function truncateFileName(name) {
  if (!name) return "";
  if (name.length <= MAX_DISPLAY_NAME) return name;
  const parts = name.split(".");
  const ext = parts.length > 1 ? parts.pop() : "";
  const base = parts.join(".");
  const allowed = MAX_DISPLAY_NAME - (ext ? ext.length + 4 : 3);
  return `${base.slice(0, allowed)}....${ext}`;
}

export function initUploader({ formId = "uploadForm", fileInputId = "imageUpload", fileLabelId = "upload" } = {}) {
  const form = document.getElementById(formId);
  const fileInput = document.getElementById(fileInputId);
  const fileLabel = document.getElementById(fileLabelId);
  const gallery = document.getElementById("gallery");

  if (!form || !fileInput) return;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) fileLabel.textContent = `Selected: ${truncateFileName(file.name)}`;
    else fileLabel.textContent = "Select File";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const head = sanitize(document.getElementById("head").value || "");
    const title = sanitize(document.getElementById("title").value || "");
    const rawTags = document.getElementById("customTagInput").value || "";

    const uniqueTags = [...new Set(rawTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))];

    if (!fileInput.files.length) return alert("Please upload a file");
    if (uniqueTags.length === 0) return alert("Please enter atleast one tag");

    const file = fileInput.files[0];
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    
    if (!isImage && !isVideo) return alert("Please upload an image or video file");

    const fileName = `${Date.now()}_${file.name}`;

    // placeholder
    const placeholder = document.createElement("figure");
    placeholder.classList.add("loading");
    placeholder.innerHTML = `<div class="loading-placeholder">Uploading...</div>`;
    if (gallery) gallery.prepend(placeholder);

    const { data: fileData, error: fileError } = await supabase.storage.from("gallery").upload(fileName, file);
    if (fileError) {
      if (gallery) gallery.removeChild(placeholder);
      return alert(fileError.message);
    }

    const { data: publicData, error: urlError } = await supabase.storage.from("gallery").getPublicUrl(fileName);
    if (urlError) {
      if (gallery) gallery.removeChild(placeholder);
      return alert(urlError.message);
    }

    const mediaUrl = publicData.publicUrl;
    const mediaType = isImage ? "image" : "video";

    // mark placeholder with the mediaUrl so realtime subscriber can detect it
    try {
      if (placeholder) {
        placeholder.dataset.uploadingUrl = mediaUrl;
        placeholder.dataset.mediaType = mediaType;
      }
    } catch (e) {
      /* ignore */
    }

    const { data: galleryData, error: insertError } = await supabase
      .from("gallery")
      .insert([{ head, title, image_url: mediaUrl, media_type: mediaType }])
      .select();

    if (insertError) {
      if (gallery) gallery.removeChild(placeholder);
      return alert(insertError.message);
    }

    const mediaId = galleryData[0].id;
    await supabase.from("image_tags").insert(uniqueTags.map((tag) => ({ image_id: mediaId, tag })));

    form.reset();
    if (fileLabel) fileLabel.textContent = "Select File";

    const figure = createFigure(mediaUrl, head, title, uniqueTags, mediaType);
    if (gallery) {
      gallery.replaceChild(figure, placeholder);
      // remove temporary marker
      try {
        delete figure.dataset.uploadingUrl;
      } catch (e) {}
    }
  });
}
