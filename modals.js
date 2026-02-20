import { sanitize } from "./utils.js";

let imageModalElement = null;

function closeAllModals() {
  const all = document.querySelectorAll(".visible");
  all.forEach((m) => m.classList.remove("visible"));
  document.body.style.overflow = "";
}

function toggleScrollLock(lock) {
  document.body.style.overflow = lock ? "hidden" : "";
}

export function initInfoModal(buttonId, data) {
  const infoButton = document.getElementById(buttonId);
  if (!infoButton) return;

  const content = document.createElement("div");
  content.id = "content";
  content.innerHTML = `
    <div id="infoContent">
      <img id="mlephImg" src="./mlephImg.svg" alt="mleph logo">
      <p id="info">${sanitize(data.body)}<br><br>Developed by: <a href="${sanitize(data.website)}">${sanitize(data.developer)}</a></p>
      <span class="closeModal" role="button" tabindex="0">&times;</span>
      <div id="contentOverlay"></div>
    </div>
  `;
  document.body.appendChild(content);

  const closeModal = content.querySelector(".closeModal");
  const overlay = content.querySelector("#contentOverlay");

  infoButton.addEventListener("click", () => {
    closeAllModals();
    const isVisible = content.classList.toggle("visible");
    toggleScrollLock(isVisible);
  });

  closeModal.addEventListener("click", () => closeAllModals());
  overlay.addEventListener("click", () => closeAllModals());
}

export function initStoryModal(buttonId, data) {
  const stories = data.stories || [];
  const storyModal = document.createElement("div");
  storyModal.id = "storyModal";
  storyModal.innerHTML = `
    <div id="storyModalOverlay"></div>
    <div id="storyModalContent" role="dialog" aria-modal="true">
      <span class="closeModal" role="button" tabindex="0">&times;</span>
      <div id="storyContainer"></div>
    </div>
  `;
  document.body.appendChild(storyModal);

  const closeModal = storyModal.querySelector(".closeModal");
  const overlay = storyModal.querySelector("#storyModalOverlay");
  const storyContainer = storyModal.querySelector("#storyContainer");

  stories.forEach((story) => {
    const storyEl = document.createElement("div");
    storyEl.classList.add("storyItem");
    storyEl.innerHTML = `
      <h2>${sanitize(story.title)}</h2>
      <p>Written by: ${sanitize(story.author)}</p>
      <p>${sanitize(story.description)}</p>
      <a href="${sanitize(story.link)}" target="_blank">Read here</a>
    `;
    storyContainer.appendChild(storyEl);
  });

  const storyButton = document.getElementById(buttonId);
  if (storyButton) {
    storyButton.addEventListener("click", () => {
      closeAllModals();
      const isVisible = storyModal.classList.toggle("visible");
      toggleScrollLock(isVisible);
    });
  }

  closeModal.addEventListener("click", () => closeAllModals());
  overlay.addEventListener("click", () => closeAllModals());
}

function buildImageModal() {
  imageModalElement = document.createElement("div");
  imageModalElement.id = "imageModal";
  imageModalElement.setAttribute("role", "dialog");
  imageModalElement.setAttribute("aria-modal", "true");
  imageModalElement.innerHTML = `
    <div id="modalContent">
      <div id="modalText">
        <div id="modalHead"></div>
        <figcaption id="modalCaption"></figcaption>
        <div id="modalTags">Tags:</div>
      </div>
    </div>
    <span id="modalClose" role="button" tabindex="0">&times;</span>
  `;
  document.body.appendChild(imageModalElement);

  const modalClose = imageModalElement.querySelector("#modalClose");
  modalClose.addEventListener("click", () => closeImageModal());
  imageModalElement.addEventListener("click", (e) => {
    if (e.target === imageModalElement) closeImageModal();
  });

  // Escape key
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeImageModal();
  });
}

export function openImageModal(mediaUrl, head, title, tags, mediaType = "image") {
  if (!imageModalElement) buildImageModal();
  closeAllModals();
  const modalContent = imageModalElement.querySelector("#modalContent");
  const modalHead = imageModalElement.querySelector("#modalHead");
  const modalCaption = imageModalElement.querySelector("#modalCaption");
  const modalTags = imageModalElement.querySelector("#modalTags");

  // Remove any existing media from previous modal
  const existingMedia = modalContent.querySelector("img, video");
  if (existingMedia) existingMedia.remove();

  // Create and insert media at the beginning of modalContent (before modalText)
  if (mediaType === "video") {
    const video = document.createElement("video");
    video.id = "modalVideo";
    video.src = mediaUrl;
    video.controls = false;
    video.autoplay = true;
    video.muted = true;
    modalContent.insertBefore(video, modalContent.firstChild);
  } else {
    const img = document.createElement("img");
    img.id = "modalImg";
    img.src = mediaUrl;
    img.alt = title || "image";
    modalContent.insertBefore(img, modalContent.firstChild);
  }

  modalHead.innerHTML = sanitize(head || "");
  modalCaption.innerHTML = sanitize(title || "");
  modalTags.innerHTML = (tags || [])
    .map((t) => `<span class="tag" id="${t.replace(/\s+/g, "-")}">${sanitize(t)}</span>`)
    .join(" ");

  imageModalElement.classList.add("visible");
  toggleScrollLock(true);
}

function closeImageModal() {
  if (!imageModalElement) return;
  imageModalElement.classList.remove("visible");
  toggleScrollLock(false);
}
