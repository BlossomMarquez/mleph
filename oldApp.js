import { initInfoModal, initStoryModal } from "./modals.js";
import { initUploader } from "./uploader.js";
import { loadGallery, subscribeToUpdates, attachDelegatedEvents } from "./gallery.js";
import { loadAllTags } from "./tags.js";

// Initialize modals (fetch data files and pass to modal initializers)
fetch("./infoModal.json")
  .then((r) => r.json())
  .then((data) => initInfoModal("infoModalButton", data))
  .catch((err) => console.error("Error loading infoModal.json:", err));

fetch("./storyModal.json")
  .then((r) => r.json())
  .then((data) => initStoryModal("storyButton", data))
  .catch((err) => console.error("Error loading storyModal.json", err));

// Initialize uploader and gallery behaviors
window.addEventListener("DOMContentLoaded", async () => {
  initUploader({ formId: "uploadForm", fileInputId: "imageUpload", fileLabelId: "upload" });
  attachDelegatedEvents();
  await loadGallery();
  subscribeToUpdates();
  loadAllTags();
});
