import { sanitize, truncate } from "./utils.js";
import { openImageModal } from "./modals.js";
import { supabase } from "./supabaseClient.js";

const gallery = document.getElementById("gallery");

export function createFigure(imageUrl, head, title, tags) {
  const figure = document.createElement("figure");
  figure.classList.add("child");
  figure.dataset.url = imageUrl;
  figure.dataset.head = head || "";
  figure.dataset.title = title || "";
  figure.dataset.tags = JSON.stringify(tags || []);

  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = title || tags.join(", ") || "image";
  img.style.cursor = "pointer";
  img.loading = "lazy";
  img.decoding = "async";

  const headDiv = document.createElement("div");
  headDiv.className = "head";
  headDiv.innerHTML = sanitize(head || "");

  const caption = document.createElement("figcaption");
  caption.className = "caption";
  caption.dataset.fulltext = sanitize(title || "");
  caption.textContent = truncate(title || "", 50);

  const tagsDiv = document.createElement("div");
  tagsDiv.className = "tags";
  tagsDiv.innerHTML = (tags || [])
    .map((t) => `<span class="tag">${sanitize(t)}</span>`)
    .join(" ");

  figure.appendChild(img);
  figure.appendChild(headDiv);
  figure.appendChild(caption);
  figure.appendChild(tagsDiv);

  return figure;
}

export function renderGallery(items) {
  if (!gallery) return;
  if (!items || !items.length) {
    gallery.innerHTML = "<p>No images found.</p>";
    return;
  }

  gallery.innerHTML = "";
  items.forEach((item) => {
    const tagsArray = item.image_tags?.map((t) => t.tag) || item.tags || [];
    const cleanHead = sanitize(item.head || "");
    const cleanTitle = sanitize(item.title || "");
    const fig = createFigure(item.image_url, cleanHead, cleanTitle, tagsArray);
    // store id if present
    if (item.id) fig.dataset.id = item.id;
    gallery.appendChild(fig);
  });
}

export async function loadGallery() {
  const { data, error } = await supabase
    .from("gallery")
    .select("id, head, title, image_url, image_tags(tag)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load gallery error:", error);
    return;
  }

  renderGallery(data || []);
}

export function attachDelegatedEvents() {
  if (!gallery) return;

  gallery.addEventListener("click", (e) => {
    const captionEl = e.target.closest(".caption");
    if (captionEl) {
      const fullText = captionEl.dataset.fulltext || "";
      const truncated = fullText.length > 50 ? fullText.slice(0, 50) + "..." : fullText;
      const isTruncated = captionEl.textContent.endsWith("...");
      captionEl.textContent = isTruncated ? fullText : truncated;
      return;
    }

    const img = e.target.closest("img");
    if (img) {
      const fig = img.closest("figure");
      if (!fig) return;
      const imageUrl = fig.dataset.url;
      const head = fig.dataset.head;
      const title = fig.dataset.title;
      const tags = JSON.parse(fig.dataset.tags || "[]");
      openImageModal(imageUrl, head, title, tags);
    }
  });
}

export function subscribeToUpdates() {
  supabase
    .channel("gallery_updates")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "gallery" },
      (payload) => {
        const item = payload.new;
        if (!item) return;
        // Avoid duplicates: skip if an existing figure already has the URL
        // or if there's a placeholder currently uploading the same URL.
        if (
          Array.from(gallery.children).some(
            (fig) =>
              fig.dataset.url === item.image_url || fig.dataset.uploadingUrl === item.image_url
          )
        )
          return;
        const tags = Array.isArray(item.image_tags)
          ? item.image_tags.map((t) => t.tag)
          : (item.image_tags || "").split(",").map((t) => t.trim()).filter(Boolean);
        const figure = createFigure(item.image_url, item.head, item.title, tags);
        gallery.prepend(figure);
      }
    )
    .subscribe();
}
