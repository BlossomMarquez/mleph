import { supabase } from "./supabaseClient.js";

const form = document.getElementById("uploadForm");
const gallery = document.getElementById("gallery");
const fileInput = document.getElementById("imageUpload");
const fileLabel = document.getElementById("upload");

function toggleScrollLock(lock) {
  document.body.style.overflow = lock ? "hidden" : "";
}

function closeAllModals() {
  const allModals = document.querySelectorAll(".visible");
  allModals.forEach((modal) => modal.classList.remove("visible"));
  toggleScrollLock(false);
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

// On-click infoModal content
fetch("./infoModal.json")
  .then((response) => response.json())
  .then((data) => {
    const infoButton = document.createElement("div");
    infoButton.id = "infoModalButton";
    infoButton.textContent = "info";

    const content = document.createElement("div");
    content.id = "content"; // Info Modal
    content.innerHTML = `
    <div id="infoContent">
<img id="mlephImg" src="./mlephImg.svg">
 <p id="info">${data.body}
 <br>
 <br>
 Developed by:
 <a href="${data.website}">
 ${data.developer} 
</a>  </p>
  <span id="closeModal">&times;</span>
  <div id="contentOverlay"></div>
  </div>
`;

    const formSection = document.getElementById("uploadForm");
    formSection.parentNode.insertBefore(infoButton, formSection);

    document.body.appendChild(content);

    const closeModal = content.querySelector("#closeModal");
    const overlay = content.querySelector("#contentOverlay");

    infoButton.addEventListener("click", () => {
      closeAllModals();
      const isVisible = content.classList.toggle("visible");
      toggleScrollLock(isVisible);
    });

    closeModal.addEventListener("click", () => closeAllModals());
    overlay.addEventListener("click", () => closeAllModals());
  })
  .catch((err) => console.error("Error loading infoModal.json:", err));

// ---------------------------
// On-click image modal content
// ---------------------------
const modal = document.createElement("div");
modal.id = "imageModal";
modal.innerHTML = `
<div id="modalContent">
<img id="modalImg">
<div id="modalText">
<div id="modalHead"></div>
<figcaption id="modalCaption"></figcaption>
<div id="modalTags">Tags:</div>
</div>
</div>
<span id="modalClose">&times;</span>
`;
document.body.appendChild(modal);

const modalImg = modal.querySelector("#modalImg");
const modalHead = modal.querySelector("#modalHead");
const modalCaption = modal.querySelector("#modalCaption");
const modalTags = modal.querySelector("#modalTags");
const modalClose = modal.querySelector("#modalClose");

function openImageModal(imageUrl, head, title, tags) {
  closeAllModals();
  modalImg.src = imageUrl;
  modalCaption.innerHTML = title;
  modalHead.innerHTML = head;
  modalTags.innerHTML = tags
    .map((t) => `<span class="tag" id="${t.replace(/\s+/g, "-")}">${t}</span>`)
    .join(" ");
  modal.classList.add("visible");
  toggleScrollLock(true);
}

function closeImageModal() {
  modal.classList.remove("visible");
  toggleScrollLock(false);
}

modalClose.addEventListener("click", closeImageModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeImageModal();
});

// ---------------------------
// Handle form submission
// ---------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const head = document.getElementById("head").value;
  const cleanHead = DOMPurify.sanitize(head, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "br"],
    ALLOWED_ATTR: ["target"],
  });
  const title = document.getElementById("title").value;
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
    <div class="loading-placeholder" style="
      width: 200px;
      height: 200px;
      background: #eee;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: #000000ff;
    ">
      Uploading...
    </div>
  `;
  gallery.prepend(placeholder);

  // Upload to Supabase Storage
  const { data: fileData, error: fileError } = await supabase.storage
    .from("gallery")
    .upload(fileName, file);
  if (fileError) {
    gallery.removeChild(placeholder);
    return alert(fileError.message);
  }

  // Get public URL
  const { data: publicData, error: urlError } = await supabase.storage
    .from("gallery")
    .getPublicUrl(fileName);
  if (urlError) {
    gallery.removeChild(placeholder);
    return alert(urlError.message);
  }

  const imageUrl = publicData.publicUrl;

  // Insert into database
  const { data: galleryData, error: insertError } = await supabase
    .from("gallery")
    .insert([{ head: cleanHead, title, image_url: imageUrl }])
    .select();

  if (insertError) {
    gallery.removeChild(placeholder);
    return alert(insertError.message);
  }

  const imageId = galleryData[0].id;
  await supabase.from("image_tags").insert(
    uniqueTags.map((tag) => ({image_id: imageId, tag}))
  );

  form.reset();
  fileLabel.textContent = "Select Image";

  // Replace placeholder with actual image
  const figure = createFigure(imageUrl, cleanHead, title, uniqueTags);
  gallery.replaceChild(figure, placeholder);
});

function createFigure(imageUrl, head, title, tag) {
  const figure = document.createElement("figure");
  figure.classList.add("child");
  figure.dataset.url = imageUrl;
  figure.dataset.head = head;
  figure.dataset.title = title;
  figure.dataset.tags = JSON.stringify(tag);

  const truncated =
    title.length > 50 ? title.slice(0, 50) + "..." : title;

  figure.innerHTML = `
    <img src="${imageUrl}" alt="${tag}" style="cursor:pointer;">
  <div class="head">${head}</div>
    <figcaption class="caption" data-fulltext="${title}">${truncated}</figcaption>
    <div class="tags">
    ${tag.map((t) => `<span class="tag">${t}</span>`).join(" ")}
    </div>
  `;

const img = figure.querySelector("img");
const caption = figure.querySelector(".caption");

caption.addEventListener("click", () => {
    caption.textContent = 
    caption.textContent === truncated ? title : truncated;
});

img.addEventListener("click", () => {
    const tagsArray = JSON.parse(figure.dataset.tags);
    openImageModal(imageUrl, head, title, tagsArray)
});

  return figure;
}

gallery.querySelectorAll("figure").forEach((fig) => {
  const img = fig.querySelector("img");
  const captionEl = fig.querySelector(".caption");

  captionEl.addEventListener("click", () => {
    const fullText = captionEl.dataset.fulltext;
    const truncated =
      fullText.length > 50 ? fullText.slice(0, 50) + "..." : fullText;
    const isTruncated = captionEl.textContent.endsWith("...");
    captionEl.textContent = isTruncated ? fullText : truncated;
  });

  img.addEventListener("click", () => {
    const modalCaption = document.getElementById("modalCaption");
    const modalTags = document.getElementById("modalTags");
    const modalHead = document.getElementById("modalHead");

    const imageUrl = fig.dataset.url;
    const cleanHead = fig.dataset.head;
    const title = fig.dataset.title;
    let tag = JSON.parse(fig.dataset.tags);

    modalImg.src = imageUrl;
    modalHead.innerHTML = cleanHead;
    modalCaption.innerHTML = title;
    modalTags.innerHTML = tag
      .map(
        (t) => `<span class="tag" id="${t.replace(/\s+/g, "-")}">${t}</span>`
      )
      .join(" ");

  });
});

// ---------------------------
// Populate tag container
// ---------------------------
async function loadAllTags() {
  const tagContainer = document.getElementById("tagContainer");
  tagContainer.innerHTML = "<p>Loading tags...</p>";

  const { data, error } = await supabase.from("image_tags").select("tag");

  if (error) {
    console.error("Error loading tags", error);
    tagContainer.innerHTML = "<p>Error loading tags</p>";
    return;
  }

  const uniqueTags = [...new Set(data.map((item) => item.tag))].sort();

  if (uniqueTags.length === 0) {
    tagContainer.innerHTML = "<p>No tags</p>";
    return;
  }

  tagContainer.innerHTML = uniqueTags
    .map((tag) => `<span class="tag" data-tag="${tag}">${tag}</span>`)
    .join(" ");

  tagContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("tag")) {
      e.target.classList.toggle("active");
      const selectedTags = Array.from(
        document.querySelectorAll(".tag.active")
      ).map((el) => el.dataset.tag);
      updateGallery(selectedTags);
    }
  });
}

async function updateGallery(selectedTags) {
  const gallery = document.getElementById("gallery");

  if (selectedTags.length === 0) {
    await loadGallery();
    return;
  }

  const { data: tagMatches, error: tagError } = await supabase
    .from("image_tags")
    .select("image_id, tag")
    .in("tag", selectedTags);

  if (tagError) {
    console.error("Error loading tags:", tagError);
    return;
  }

  const matchCounts = {};
  for (const row of tagMatches) {
    matchCounts[row.image_id] = (matchCounts[row.image_id] || 0) + 1;
  }

  const matchingImageIds = Object.keys(matchCounts).filter(
    (id) => matchCounts[id] === selectedTags.length
  );

  if (matchingImageIds.length === 0) {
    gallery.innerHTML = "<p>No images match all selected tags... yet</p>";
    return;
  }

  const { data: images, error: imgError } = await supabase
    .from("gallery")
    .select(`id, head, title, image_url, image_tags(tag)`)
    .in("id", matchingImageIds);

  if (imgError) {
    console.error("Error getting image ids:", imgError);
    return;
  }
  renderGallery(images);
}

function attachImageModalEvents() {
  const figures = document.querySelectorAll("#gallery figure.child");

  figures.forEach((fig) => {
    const img = fig.querySelector("img");
    const captionEl = fig.querySelector(".caption");

    captionEl.addEventListener("click", () => {
      const fullText = captionEl.dataset.fulltext;
      const truncated =
        fullText.length > 50 ? fullText.slice(0, 50) + "..." : fullText;
      const isTruncated = captionEl.textContent.endsWith("...");
      captionEl.textContent = isTruncated ? fullText : truncated;
    });

    img.addEventListener("click", () => {
     const imageUrl = fig.dataset.url;
     const head = fig.dataset.head;
     const title = fig.dataset.title;
     const tags = JSON.parse(fig.dataset.tags || "[]");

      openImageModal(imageUrl, head, title, tags);
    });
  });
}

// // ---------------------------
// // Load gallery from database
// // ---------------------------
async function loadGallery() {
  const { data, error } = await supabase
    .from("gallery")
    .select("id, head, title, image_url, image_tags(tag)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load gallery error:", error);
    return;
  }
  renderGallery(data);
}

// // ---------------------------
// // Build gallery from database
// // ---------------------------
async function renderGallery(images) {
  if (!images || !images.length) {
    gallery.innerHTML = "<p>No images found.</p>";
    return;
  }

  gallery.innerHTML = images
    .map((item) => {
      const tagsArray = item.image_tags?.map((t) => t.tag) || [];
      const cleanHead = DOMPurify.sanitize(item.head, {
        ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "br"],
        ALLOWED_ATTR: ["target"],
      });
      const cleanTitle = DOMPurify.sanitize(item.title, {
        ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "br"],
        ALLOWED_ATTR: ["target"],
      });
      const maxLength = 50;
      const truncated =
        item.title.length > maxLength
          ? item.title.slice(0, maxLength) + "..."
          : item.title;

      const tagList = tagsArray
        .map((t) => `<span class="tag">${t}</span>`)
        .join(" ");

      return `
        <figure class="child"
        data-url="${item.image_url}"
        data-head ="${cleanHead}"
        data-title="${cleanTitle.replace(/"/g, "&quot;")}"
            data-tag='${JSON.stringify(tagsArray)}'>
          <img src="${item.image_url}" alt="${tagsArray.join(
        ", "
      )}" style="cursor:pointer;">
      <div class="head">${cleanHead}</div>
          <figcaption class="caption" data-fulltext="${cleanTitle}">${truncated}</figcaption>
          <div class="tags">Tags:${tagList}</div>
        </figure>`;
    })
    .join("");

  attachImageModalEvents();
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
            (fig) => fig.querySelector("img")?.src === item.image_url
          )
        )
          return;
        const figure = createFigure(
          item.image_url,
          item.head,
          item.title,
          Array.isArray(item.image_tags)
            ? item.image_tags
            : item.image_tags.split(",").map((t) => t.trim())
        );
        gallery.prepend(figure);
      }
    )
    .subscribe();
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadGallery();
  subscribeToUpdates();
  loadAllTags();
});
