import { supabase } from "./supabaseClient.js";

const form = document.getElementById("uploadForm");
const gallery = document.getElementById("gallery");
const fileInput = document.getElementById("imageUpload");
const fileLabel = document.getElementById("upload");

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
    infoButton.id = "infoModal";
    infoButton.textContent = "info";

    const content = document.createElement("div");
    content.id = "content";
    content.innerHTML = `
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
`;

    const formSection = document.getElementById("uploadForm");
    formSection.parentNode.insertBefore(infoButton, formSection);

    document.body.appendChild(content);

    const closeModal = content.querySelector("#closeModal");
    const contentOverlay = content.querySelector("#contentOverlay");

    infoButton.addEventListener("click", () => {
      content.classList.toggle("visible");
      console.log("clicked infoButton");
    });

    closeModal.addEventListener("click", function () {
      content.classList.remove("visible");
    });

    window.addEventListener("click", (e) => {
      if (e.target === contentOverlay) {
        content.classList.remove("visible");
      }
    });
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

const modalImg = document.getElementById("modalImg");
const modalClose = document.getElementById("modalClose");

modalClose.onclick = () => (modal.style.display = "none");
modal.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

const imgOverlay = document.getElementById("imageOverlay");
window.addEventListener("click", (e) => {
  if (e.target === imgOverlay) {
    modal.style.display = "none";
  }
});

// ---------------------------
// Load gallery and subscribe on page load
// ---------------------------
window.addEventListener("DOMContentLoaded", async () => {
  await loadGallery();
  attachImageModalEvents();
  loadAllTags();
  subscribeToUpdates();
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
    console.error(fileError);
    alert(fileError.message);
    gallery.removeChild(placeholder);
    return;
  }

  // Get public URL
  const { data: publicData, error: urlError } = await supabase.storage
    .from("gallery")
    .getPublicUrl(fileName);
  if (urlError) {
    console.error(urlError);
    alert(urlError.message);
    gallery.removeChild(placeholder);
    return;
  }

  const imageUrl = publicData.publicUrl;

  // Insert into database
  const { data: galleryData, error: insertError } = await supabase
    .from("gallery")
    .insert([{ head: cleanHead, title, image_url: imageUrl }])
    .select();

  if (insertError) {
    console.error(insertError);
    alert(insertError.message);
    gallery.removeChild(placeholder);
    return;
  }

  const imageId = galleryData[0].id;

  if (uniqueTags.length > 0) {
    const { error: tagError } = await supabase.from("image_tags").insert(
      uniqueTags.map((tag) => ({
        image_id: imageId,
        tag: tag,
      }))
    );

    if (tagError) {
      console.error(tagError);
      alert(tagError.message);
      gallery.removeChild(placeholder);
      return;
    }
  }

  console.log(uniqueTags);
  // Reset form and label
  form.reset();
  document.getElementById("customTagInput").value = "";
  fileLabel.textContent = "Select Image";

  // Replace placeholder with actual image
  const figure = createFigure(imageUrl, cleanHead, title, uniqueTags);
  gallery.replaceChild(figure, placeholder);
});

function createFigure(imageUrl, head, title, tag) {
  const figure = document.createElement("figure");
  figure.classList.add("child");

  const maxLength = 50;
  const truncated =
    title.length > maxLength ? title.slice(0, maxLength) + "..." : title;

  figure.innerHTML = `
    <img src="${imageUrl}" alt="${tag}" style="cursor:pointer;">
  <div class="head">${head}</div>
    <figcaption class="caption">${truncated}</figcaption>
    <div class="tags">
    ${tag
      .map(
        (t) => `<span class="tag" id="${t.replace(/\s+/g, "-")}">${t}</span>`
      )
      .join(" ")}
    </div>
  `;

  const img = figure.querySelector("img");
  img.addEventListener("click", () => {
    const modalCaption = document.getElementById("modalCaption");
    const modalHead = document.getElementById("modalHead");
    const modalTags = document.getElementById("modalTags");

    modalImg.src = imageUrl;
    modalCaption.innerHTML = title;
    modalHead.innerHTML = head;
    modalTags.innerHTML = tag
      .map(
        (t) => `<span class="tag" id="${t.replace(/\s+/g, "-")}">${t}</span>`
      )
      .join(" ");

    modal.style.display = "flex";
  });

  const captionEl = figure.querySelector(".caption");
  captionEl.addEventListener("click", () => {
    captionEl.textContent =
      captionEl.textContent === truncated ? title : truncated;
  });

  return figure;
}

// // ---------------------------
// // Build gallery from database
// // ---------------------------
async function renderGallery(images) {
  const gallery = document.getElementById("gallery");
  if (!images || images.length === 0) {
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
      const cleanCaption = DOMPurify.sanitize(item.title, {
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
        data-title="${cleanCaption.replace(/"/g, "&quot;")}"
            data-tag='${JSON.stringify(tagsArray)}'>
          <img src="${item.image_url}" alt="${tagsArray.join(
        ", "
      )}" style="cursor:pointer;">
      <div class="head">${cleanHead}</div>
          <figcaption class="caption" data-fulltext="${cleanCaption}">${truncated}</figcaption>
          <div class="tags">Tags:${tagList}</div>
        </figure>`;
    })
    .join("");

  attachImageModalEvents();
}
// // ---------------------------
// // Load gallery from database
// // ---------------------------
async function loadGallery() {
  const { data, error } = await supabase
    .from("gallery")
    .select(`id, head, title, image_url, image_tags(tag)`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load gallery error:", error);
    return;
  }
  renderGallery(data);
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
    let tag = JSON.parse(fig.dataset.tag);

    modalImg.src = imageUrl;
    modalHead.innerHTML = cleanHead;
    modalCaption.innerHTML = title;

    modalTags.innerHTML = tag
      .map(
        (t) => `<span class="tag" id="${t.replace(/\s+/g, "-")}">${t}</span>`
      )
      .join(" ");

    modal.style.display = "flex";
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
      const modalCaption = document.getElementById("modalCaption");
      const modalTags = document.getElementById("modalTags");
      const modalHead = document.getElementById("modalHead");

      const imageUrl = fig.dataset.url;
      const cleanHead = fig.dataset.head;
      const title = fig.dataset.title;
      const tag = JSON.parse(fig.dataset.tag);

      modalImg.src = imageUrl;
      modalHead.innerHTML = cleanHead;
      modalCaption.innerHTML = title;
      modalTags.innerHTML = tag
        .map((t) => `<span class="tag">${t}</span>`)
        .join(" ");

      modal.style.display = "flex";
    });
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
