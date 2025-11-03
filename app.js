import { supabase } from "./supabaseClient.js";

const form = document.getElementById("uploadForm");
const gallery = document.getElementById("gallery");
const fileInput = document.getElementById("imageUpload");
const fileLabel = document.getElementById("upload");
const tagContainer = document.getElementById("tagContainer");

const truncateText = (str, maxLength = 50) =>
  str.length > maxLength ? str.slice(0, maxLength) + "..." : str;

function setModalScrollLock(isLocked) {
  document.body.style.overflow = isLocked ? "hidden" : "";
}

function openModal(modal) {
  document.querySelectorAll(".modal.visible").forEach((m) => {
    if (m !== modal) closeModal(m);
  });
  modal.classList.add("visible");
  setModalScrollLock(true);
}

function closeModal(modal) {
  modal.classList.remove("visible");
  setModalScrollLock(false);
}

// ---------------------------
// File input and label handling
// ---------------------------
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (file) {
    const maxLength = 20; // max chars for display
    let displayName = file.name;
    if (displayName.length > maxLength) {
      const extension = displayName.split(".").pop();
      const nameWithoutExt = displayName.slice(
        0,
        maxLength - extension.length - 2
      );
      displayName = `${nameWithoutExt}....${extension}`;
    }
    fileLabel.textContent = `Selected: ${displayName}`;
  } else {
    fileLabel.textContent = "Select Image";
  }
});

const infoModal = document.createElement("div");
infoModal.id = "infoModalButton";
infoModal.textContent = "info";
document.body.appendChild(infoModal);

const infoContent = document.createElement("div");
infoContent.id = "infoContent";
infoContent.classList.add("modal");
infoContent.innerHTML = `
<div class="modal-inner">
<img id="mlephImg" src="./mlephImg.svg">
<p id="infoText"></p>
<span class="closeModal">&times;</span>
<div class="modal-overlay"></div>
</div>
`;
document.body.appendChild(infoContent);

// On-click infoModal content
fetch("./infoModal.json")
  .then((res) => res.json())
  .then((data) => {
    infoContent.querySelector("#infoText").innerHTML = `
    ${data.body}<br><br>
    Developed by: <a href="${data.website}" target="_blank">${data.developer}</a>`;
  })
  .catch((err) => console.error("Error loading infoModal.json", err));

const imageModal = document.createElement("div");
imageModal.id = "imageModal";
imageModal.classList.add("modal");
imageModal.innerHTML = `
<div class="modal-inner">
<img id="modalImg">
<div id="modalText">
<div id="modalHead"></div>
<figcaption id="modalCaption"></figcaption>
<div id="modalTags">Tags</div>
</div>
<span class="modal-close">&times;</span>
<div class="modal-overlay"></div>
</div>
`;
document.body.appendChild(imageModal);

const modalImg = imageModal.querySelector("#modalImg");
const modalHead = imageModal.querySelector("#modalHead");
const modalCaption = imageModal.querySelector("#modalCaption");
const modalTags = imageModal.querySelector("#modalTags");

document.addEventListener("click", (e) => {
  if (e.target.id === "infoModalButton") {
    openModal(infoContent);
  }

  if (e.target.closest("#gallery figure img")) {
    const figure = e.target.closest("figure");
    const tags = JSON.parse(figure.dataset.tag || "[]");

    modalImg.src = figure.dataset.url;
    modalHead.innerHTML = figure.dataset.head;
    modalCaption.innerHTML = figure.data.title;
    modalTags.innerHTML = tags
      .map(
        (t) => `<span class="tag" id="${t.replace(/\s+/g, "-")}">${t}</span>`
      )
      .join(" ");

    openModal(imageModal);
  }

  if (
    e.target.classList.contains("modal-close") ||
    e.target.classList.contains("modal-overlay")
  ) {
    const modal = e.target.closest(".modal");
    if (modal) close(modal);
  }

  if (e.target.closest("#tagContainer .tag")) {
    e.target.classList.toggle("active");
    const selectedTags = Array.from(
      tagContainer.querySelectorAll(".tag.active")
    ).map((el) => el.dataset.tag);
    updateGallery(selectedTags);
  }

  if (e.target.classList.contains("caption")) {
    const fullText = e.target.dataset.fulltext;
    const isTruncated = e.target.textContent.endsWith("...");
    e.target.textContent = isTruncated ? fullText : truncateText(fullText);
  }
});

function closeModal() {
  modal.classList.remove("visible");
  document.body.style.overflow = "";

  modalImg.src = "";
  modalHead.innerHTML = "";
  modalCaption.innerHTML = "";
  modalTags.innerHTML = "";
}
modalClose.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

// ---------------------------
// Handle form submission
// ---------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const cleanHead = DOMPurify.sanitize(document.getElementById("head").value, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "br"],
    ALLOWED_ATTR: ["target"],
  });
  const title = DOMPurify.sanitize(document.getElementById("title").value, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "br"],
    ALLOWED_ATTR: ["target"],
  });
  const rawTags = document.getElementById("customTagInput").value;

  const uniqueTags = [
    ...new Set(
      rawTags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];

  if (!fileInput.files.length) {
    alert("Please upload an image");
    return;
  }
  if (uniqueTags.length === 0) {
    alert("Please enter atleast one tag");
    return;
  }

  const file = fileInput.files[0];
  const fileName = `${Date.now()}_${file.name}`;

  // Add loading placeholder
  const placeholder = document.createElement("figure");
  placeholder.classList.add("loading");
  placeholder.innerHTML = `
    <div class="loading-placeholder">
      Uploading...
    </div>
  `;
  gallery.prepend(placeholder);

  // Upload to Supabase Storage
  const { data: fileData, error: fileError } = await supabase.storage
    .from("gallery")
    .upload(fileName, file);
  if (fileError) return;
  alert(fileError.message);

  // Get public URL
  const { data: publicData, error: urlError } = await supabase.storage
    .from("gallery")
    .getPublicUrl(fileName);
  if (urlError) return;
  alert(urlError.message);

  const imageUrl = publicData.publicUrl;

  // Insert into database
  const { data: galleryData, error: insertError } = await supabase
    .from("gallery")
    .insert([{ head: cleanHead, title, image_url: imageUrl }])
    .select();

  if (insertError) alert(insertError.message);

  const imageId = galleryData[0].id;

  if (uniqueTags.length > 0) {
    const { error: tagError } = await supabase.from("image_tags").insert(
      uniqueTags.map((tag) => ({
        image_id: imageId,
        tag: tag,
      }))
    );

    if (tagError) return;
    alert(tagError.message);
  }

  const figure = createFigure(imageUrl, head, title, uniqueTags);
  gallery.replaceChild(figure, placeholder);

  // Reset form and label
  form.reset();
  fileLabel.textContent = "Select Image";
  document.getElementById("customTagInput").value = "";
});

function createFigure(url, head, title, tag) {
  const figure = document.createElement("figure");
  figure.classList.add("child");
  figure.dataset.url = url;
  figure.dataset.head = head;
  figure.dataset.title = title;
  figure.dataset.tag = JSON.stringify(tags);

  figure.innerHTML = `
    <img src="${Url}" alt="${tags.join(", ")}" style="cursor:pointer;">
  <div class="head">${head}</div>
    <figcaption class="caption" data-fulltext="${title}">${truncateText(
    title
  )}</figcaption>
    <div class="tags">
    ${tag.map((t) => `<span class="tag">${t}</span>`).join(" ")}
    </div>
  `;
  return figure;
}
// // ---------------------------
// // Build gallery from database
// // ---------------------------
async function loadGallery() {
  const { data, error } = await supabase
    .from("gallery")
    .select(`id, head, title, image_url, image_tags(tag)`)
    .order("created_at", { ascending: false });
  if (error) return console.error(error);

  gallery.innerHTML = "";
  data.forEach((item) => {
    const tagsArray = item.image_tags?.map((t) => t.tag) || [];
    const figure = createdFigure(
      item.image_url,
      item.head,
      item.title,
      tagsArray
    );
    gallery.appendChild(figure);
  });
}

async function updateGallery(selectedTags) {
  if (!selectedTags.length) return loadGallery();

  const { data: tagMatches, error } = await supabase
    .from("image_tags")
    .select("image_id")
    .in("tag", selectedTags);
  if (error) return console.error(error);

  const matchCounts = {};
  tagMatches.forEach((row) => {
    matchCounts[row.image_id] = (matchCounts[row.image_id] || 0) + 1;
  });

  const matchingIds = Object.keys(matchCounts).filter(
    (id) => matchCounts[id] === selectedTags.length
  );
  if (!matchingIds.length)
    return (gallery.innerHTML =
      "<p>No images match all selected tags... yet</p>");

  const { data: images, error: imgError } = await supabase
    .from("gallery")
    .select(`id, head, title, image_url, image_tags(tag)`)
    .in("id", matchingIds);
  if (imgError) return console.error(imgError);

  gallery.innerHTML = "";
  images.forEach((item) => {
    const tagsArray = item.image_tags?.map((t) => t.tag) || [];
    gallery.appendChild(
      createFigure(item.image_url, item.head, item.title, tagsArray)
    );
  });
}
// ---------------------------
// Realtime subscription (no duplicates)
// ---------------------------
function subscribeToUpdates() {
  supabase
    .channel("gallery_updates")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "gallery" },
      (payload) => {
        const item = payload.new;

        // Skip if the figure already exists
        if (
          Array.from(gallery.children).some(
            (f) => f.querySelector("img")?.src === item.image_url
          )
        )
          return;
        const tagsArray = item.image_tags?.map((t) => t.tag) || [];
        gallery.prepend(
          createFigure(item.image_url, item.head, item.title, tagsArray)
        );
      }
    )
    .subscribe();
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadGallery();
  await loadAllTags();
  subscribeToUpdates();
});
