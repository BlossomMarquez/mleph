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

const modal = document.createElement("div");
modal.id = "imageModal";
modal.innerHTML = `
<div id="modalContent">
<img id="modalImg">
<div id="modalText">
<div id="modalHead"></div>
<figcaption id="modalCaption"></figcaption>
<div id="modalTags"></div>
</div>
</div>
<span id="modalClose">&times;</span>`;

document.body.appendChild(modal);

const modalImg = document.getElementById("modalImg");
const modalClose = document.getElementById("modalClose");

modalClose.onclick = () => (modal.style.display = "none");
modal.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

// ---------------------------
// Load gallery and subscribe on page load
// ---------------------------
window.addEventListener("DOMContentLoaded", () => {
  loadGallery();
  subscribeToUpdates();
});

// ---------------------------
// Handle form submission
// ---------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const head = document.getElementById("head").value;
  const cleanHead = DOMPurify.sanitize(head, {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "br"],
  ALLOWED_ATTR: ["target"],
});
  const title = document.getElementById("title").value;
  const tagElements = document.querySelectorAll('input[name="tags"]:checked');
  const tags = Array.from(tagElements).map((tag) => tag.value);

  if (!fileInput.files.length) {
    alert("Please upload an image");
    return;
  }
  if (tags.length === 0) {
    alert("Please select at least one tag");
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
  const { error: insertError } = await supabase
    .from("gallery")
    .insert([{ head: cleanHead, title, image_url: imageUrl, tags }]);
  if (insertError) {
    console.error(insertError);
    alert(insertError.message);
    gallery.removeChild(placeholder);
    return;
  }

  // Reset form and label
  form.reset();
  fileLabel.textContent = "Select Image";

  // Replace placeholder with actual image
  const figure = createFigure(imageUrl, cleanHead, title, tags);
  gallery.replaceChild(figure, placeholder);
});

function createFigure(imageUrl, head, title, tags) {
  const figure = document.createElement("figure");
  figure.classList.add("child");

  const maxLength = 50;
  const truncated =
    title.length > maxLength ? title.slice(0, maxLength) + "..." : title;

  figure.innerHTML = `
    <img src="${imageUrl}" alt="${tags}" style="cursor:pointer;">
  <div class="head">${head}</div>
    <figcaption class="caption">${truncated}</figcaption>
    <div class="tags">
    ${tags
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
    modalTags.innerHTML = tags
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

// ---------------------------
// Load gallery from database
// ---------------------------
async function loadGallery() {
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load gallery error:", error);
    return;
  }

  gallery.innerHTML = data
    .map((item) => {
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

      const tagList = Array.isArray(item.tags)
        ? item.tags
            .map(
              (t) =>
                `<span class="tag" id="${t.replace(/\s+/g, "-")}">${t}</span>`
            )
            .join(" ")
        : item.tags
        ? item.tags
            .split(",")
            .map(
              (t) =>
                `<span class="tag" id="${t.replace(
                  /\s+/g,
                  "-"
                )}">${t.trim()}</span>`
            )
            .join(" ")
        : "";

      return `
        <figure class="child"
        data-url="${item.image_url}"
        data-head ="${cleanHead}"
        data-title="${cleanCaption.replace(/"/g, "&quot;")}"
            data-tags='${JSON.stringify(item.tags)}'>
          <img src="${item.image_url}" alt="${item.tags}" style="cursor:pointer;">
      <div class="head">${cleanHead}</div>
          <figcaption class="caption" data-fulltext="${cleanCaption}">${truncated}</figcaption>
          <div class="tags">${tagList}</div>
        </figure>`;
    })
    .join("");

  gallery.querySelectorAll("figure").forEach((fig) => {
    const img = fig.querySelector("img");
    const captionEl = fig.querySelector(".caption");

    captionEl.addEventListener("click", () => {
        const fullText = captionEl.dataset.fulltext;
        const truncated = fullText.length > 50 ? fullText.slice(0, 50) + "..." : fullText;
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
      let tags = [];
console.log(cleanHead);
      try {
        tags = JSON.parse(fig.dataset.tags);
      } catch {
        tags = fig.dataset.tags.split(",").map((t) => t.trim());
      }

      modalImg.src = imageUrl;
      modalHead.innerHTML = cleanHead;
      modalCaption.innerHTML = title;

      modalTags.innerHTML = tags
        .map(
          (t) => `<span class="tag" id="${t.replace(/\s+/g, "-")}">${t}</span>`
        )
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
          Array.isArray(item.tags)
            ? item.tags
            : item.tags.split(",").map((t) => t.trim())
        );
        gallery.prepend(figure);
      }
    )
    .subscribe();
}
