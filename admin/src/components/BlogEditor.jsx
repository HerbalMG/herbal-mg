import React, { useState, useRef, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import ImageTool from '@editorjs/image';
import Paragraph from '@editorjs/paragraph';
import LinkTool from '@editorjs/link';

import imageCompression from 'browser-image-compression';

// Tools configuration
const EDITOR_JS_TOOLS = {
  header: Header,
  list: List,
  paragraph: Paragraph,
  image: {
    class: ImageTool,
    config: {
      uploader: {
        async uploadByFile(file) {
          // Compress image before upload
          const compressed = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          });
          const formData = new FormData();
          formData.append('image', compressed);
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/upload?type=blog`, {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) throw new Error('Upload failed');
          const data = await response.json();
          return {
            success: 1,
            file: {
              url: data.imageUrl,
            },
          };
        },
      },
    },
  },
  linkTool: {
    class: LinkTool,
    config: {
      endpoint: 'http://localhost:3001/api/fetchUrl', // You may need to implement this endpoint or use a dummy one
    },
  },
};

const BlogEditor = ({ blog = {}, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [des, setDes] = useState('');
  const [tags, setTags] = useState([]);
  const [banner, setBanner] = useState('');
  const tagInputRef = useRef();
  const characterLimit = 200;
  const tagLimit = 5;

  // Editor.js direct integration
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  // Update state when blog prop changes
  useEffect(() => {
    console.log('BlogEditor received blog:', blog);
    setTitle(blog.title || '');
    setDes(blog.des || blog.short_description || '');
    setTags(Array.isArray(blog.tags) ? blog.tags : []);
    setBanner(blog.banner || blog.image_url || '');
  }, [blog.id, blog.title, blog.des, blog.short_description, blog.banner, blog.image_url, blog.tags]);

  useEffect(() => {
    // Destroy existing instance if it exists
    if (editorInstance.current && typeof editorInstance.current.destroy === 'function') {
      editorInstance.current.destroy();
      editorInstance.current = null;
    }

    // Parse content if it's a string
    let contentData = blog.content || { blocks: [] };
    if (typeof contentData === 'string') {
      try {
        contentData = JSON.parse(contentData);
      } catch (err) {
        console.error('Failed to parse content:', err);
        contentData = { blocks: [] };
      }
    }

    // Ensure content has blocks array
    if (!contentData.blocks) {
      contentData = { blocks: [] };
    }

    // Initialize new editor instance
    const timer = setTimeout(() => {
      if (editorRef.current) {
        editorInstance.current = new EditorJS({
          holder: editorRef.current,
          tools: EDITOR_JS_TOOLS,
          data: contentData,
          placeholder: 'Start writing your blog content here...',
        });
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (editorInstance.current && typeof editorInstance.current.destroy === 'function') {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, [blog.id]); // Reinitialize when blog ID changes



  const handleBannerUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    toast.loading('Uploading banner...');
    
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    });

    const formData = new FormData();
    formData.append('image', compressed);

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/upload?type=blog`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');

    const data = await response.json();
    setBanner(data.imageUrl); 

    toast.dismiss();
    toast.success('Banner uploaded!');
  } catch (err) {
    // console.error('Image upload failed', err);
    toast.dismiss();
    toast.error('Failed to upload banner');
  }
};

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.target.value.trim();
      if (value && !tags.includes(value) && tags.length < tagLimit) {
        setTags([...tags, value]);
        e.target.value = '';
      } else if (tags.length >= tagLimit) {
        toast.error(`You can add max ${tagLimit} tags`);
      }
    }
  };

  const handleRemoveTag = (idx) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!des.trim() || des.length > characterLimit) {
      toast.error(`Description is required and must be under ${characterLimit} characters`);
      return;
    }
    if (!editorInstance.current) {
      toast.error('Editor is not ready. Please try again.');
      return;
    }
    try {
      const editorData = await editorInstance.current.save();
      if (!editorData.blocks?.length) {
        toast.error('Content is required');
        return;
      }
      const newBlog = {
        ...blog,
        title,
        des,
        content: editorData,
        tags,
        banner,
        id: blog.id || Date.now(),
      };
      onSave(newBlog);
    } catch (err) {
      // console.error('Failed to save content:', err);
      toast.error('Could not save blog content');
    }
  };

  return (
    <form className="max-w-2xl mx-auto bg-white p-6 rounded shadow" onSubmit={handleSubmit}>
      <Toaster />
      {/* Banner Upload */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Banner Image</label>
        <input type="file" accept="image/*" onChange={handleBannerUpload} />
        {banner && (
          <img src={banner} alt="banner preview" className="mt-2 h-40 w-full object-cover rounded" />
        )}
      </div>
      {/* Title */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Title</label>
        <input
          className="w-full border rounded p-2"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Blog Title"
        />
      </div>
      {/* Short Description */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Short Description</label>
        <textarea
          className="w-full border rounded p-2"
          value={des}
          maxLength={characterLimit}
          onChange={e => setDes(e.target.value)}
          placeholder="Short description"
        />
        <div className="text-right text-sm text-gray-500">{characterLimit - des.length} characters left</div>
      </div>
      {/* EditorJS Content */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Content</label>
        <div className="bg-white border rounded">
          <div ref={editorRef} style={{ minHeight: 200 }} />
        </div>
      </div>
      {/* Tags */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Tags</label>
        <input
          className="w-full border rounded p-2"
          placeholder="Add a tag and press Enter"
          onKeyDown={handleAddTag}
          ref={tagInputRef}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag, idx) => (
            <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm flex items-center">
              {tag}
              <button type="button" className="ml-1 text-red-500" onClick={() => handleRemoveTag(idx)}>
                X
              </button>
            </span>
          ))}
        </div>
        <div className="text-right text-sm text-gray-500">{tagLimit - tags.length} tags left</div>
      </div>
      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded">Save</button>
        <button type="button" className="bg-gray-300 px-6 py-2 rounded" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

export default BlogEditor;
