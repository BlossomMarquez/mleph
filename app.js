// app.js
import { supabase } from './supabaseClient.js';

const form = document.getElementById('uploadForm');
const gallery = document.getElementById('gallery');

// Load gallery immediately when page loads
window.addEventListener('DOMContentLoaded', loadGallery);

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value;
  const file = document.getElementById('image').files[0];

  if (!file) return alert('Please select an image');

  // Upload image to Supabase storage
  const fileName = `${Date.now()}_${file.name}`;
  const { data: fileData, error: fileError } = await supabase.storage
    .from('gallery')
    .upload(fileName, file);

  if (fileError) {
    console.error(fileError);
    return alert('Error uploading image');
  }

  // Get public URL
  const { data: publicData } = supabase.storage
    .from('gallery')
    .getPublicUrl(fileName);
  const imageUrl = publicData.publicUrl;

  // Insert record into table
  const { error: insertError } = await supabase
    .from('gallery_items')
    .insert([{ title, image_url: imageUrl }]);

  if (insertError) {
    console.error(insertError);
    return alert('Error saving to database');
  }

  form.reset();
  loadGallery();
});

async function loadGallery() {
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  gallery.innerHTML = data
    .map(
      (item) => `
    <figure>
      <img src="${item.image_url}" alt="${item.title}">
      <figcaption>${item.title}</figcaption>
    </figure>`
    )
    .join('');

    supabase
  .channel('gallery_updates')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gallery_items' }, payload => {
    const item = payload.new
    const figure = document.createElement('figure')
    figure.innerHTML = `
      <img src="${item.image_url}" alt="${item.title}">
      <figcaption>${item.title}</figcaption>
    `
    gallery.prepend(figure)
  })
  .subscribe()

}
