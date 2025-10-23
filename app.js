
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://saqodazywonhbxuxwfjm.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

import { supabase } from './supabaseClient.js'

const form = document.getElementById('upload-form')
const gallery = document.getElementById('gallery')

form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const title = document.getElementById('title').value
    const file = document.getElementById('image').files[0]

    if (!file) return alert('Please select an image')

        // Uploads image to Supabase storage
        const fileName = `${Date.now()}_${file.name}`
        const { data: fileData, error: fileError } = await supabase.storage
        .from('gallery')
        .upload(fileName, file)

        if (fileError) {
            console.error(fileError)
            return alert('Error uploading image')
        }

        // Gets public URL
        const { data } = supabase.storage.from('gallery').getPublicUrl(fileName)
        const imageUrl = data.publicUrl

        // Inserts row into gallery_items table
        const { error: insertError } = await supabase
        .from('gallery_items')
        .insert([{ title, image_url: imageUrl }])

        if (insertError) {
            console.error(insertError)
            return alert('Error saving to database')
        }

        form.reset()
        loadGallery() // Refreshes gallery

        async function loadGallery() {
            const { data, error } = await supabase
            .from('gallery_items')
            .select('*')
            .order('created_at', { ascending: false })

            if (error) {
                console.error(error)
                return
            }

            gallery.innerHTML = data.map(item => `
                <figure>
                    <img src="${item.image_url}" alt="${item.title}">
                    </img>
                    <figcaption>${item.title}</figcaption>
                </figure>
                `).join('')

                // Loads gallery on page load
                loadGallery()
        }
})