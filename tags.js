import { supabase } from "./supabaseClient.js";
import { renderGallery } from "./gallery.js";
import { sanitize } from "./utils.js";

export async function loadAllTags(containerId = "tagContainer") {
  const tagContainer = document.getElementById(containerId);
  if (!tagContainer) return;
  tagContainer.innerHTML = "<p>Loading tags...</p>";

  const { data, error } = await supabase.from("image_tags").select("tag");
  if (error) {
    console.error("Error loading tags", error);
    tagContainer.innerHTML = "<p>Error loading tags</p>";
    return;
  }

  const uniqueTags = [...new Set((data || []).map((item) => item.tag))].sort();
  if (uniqueTags.length === 0) {
    tagContainer.innerHTML = "<p>No tags</p>";
    return;
  }

  tagContainer.innerHTML = uniqueTags
    .map((tag) => `<span class="tag" data-tag="${sanitize(tag)}">${sanitize(tag)}</span>`)
    .join(" ");

  tagContainer.addEventListener("click", async (e) => {
    if (e.target.classList.contains("tag")) {
      e.target.classList.toggle("active");
      const selectedTags = Array.from(document.querySelectorAll(".tag.active")).map((el) => el.dataset.tag);
      await updateGallery(selectedTags);
    }
  });
}

export async function updateGallery(selectedTags = []) {
  const galleryEl = document.getElementById("gallery");
  if (!galleryEl) return;

  if (selectedTags.length === 0) {
    // reload full gallery via render route (use client to fetch)
    const { data, error } = await supabase
      .from("gallery")
      .select("id, head, title, image_url, image_tags(tag)")
      .order("created_at", { ascending: false });
    if (!error) renderGallery(data || []);
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
  for (const row of tagMatches || []) {
    matchCounts[row.image_id] = (matchCounts[row.image_id] || 0) + 1;
  }

  const matchingImageIds = Object.keys(matchCounts).filter((id) => matchCounts[id] === selectedTags.length);

  if (matchingImageIds.length === 0) {
    const gallery = document.getElementById("gallery");
    if (gallery) gallery.innerHTML = "<p>No images match all selected tags... yet</p>";
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
  renderGallery(images || []);
}
