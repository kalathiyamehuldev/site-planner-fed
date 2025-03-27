
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Mock data for images
const initialImages = [
  {
    id: "img1",
    name: "Mood Board - Modern Loft",
    category: "Mood Boards",
    projectId: "p1",
    project: "Modern Loft Redesign",
    date: "2023-08-15",
    type: "JPG",
    size: "5.1 MB",
    tags: ["modern", "loft", "inspiration"],
    description: "Initial mood board for modern loft concept",
    uploadedBy: "Alex Jones",
    userId: "user1",
    url: "#", // In a real app, this would be the image URL
    thumbnail: null
  },
  {
    id: "img2",
    name: "Material Palette",
    category: "Materials",
    projectId: "p1",
    project: "Modern Loft Redesign",
    date: "2023-08-20",
    type: "PNG",
    size: "3.8 MB",
    tags: ["materials", "palette", "textures"],
    description: "Selected material palette for the project",
    uploadedBy: "Sarah Smith",
    userId: "user2",
    url: "#",
    thumbnail: null
  },
  {
    id: "img3",
    name: "Living Room Concept",
    category: "Renderings",
    projectId: "p2",
    project: "Coastal Vacation Home",
    date: "2023-08-25",
    type: "JPG",
    size: "8.2 MB",
    tags: ["living room", "concept", "rendering"],
    description: "3D rendering of proposed living room design",
    uploadedBy: "Robert Lee",
    userId: "user3",
    url: "#",
    thumbnail: null
  },
  {
    id: "img4",
    name: "Kitchen Elevation",
    category: "Elevations",
    projectId: "p1",
    project: "Modern Loft Redesign",
    date: "2023-09-01",
    type: "JPG",
    size: "4.5 MB",
    tags: ["kitchen", "elevation", "drawing"],
    description: "Kitchen elevation drawing with measurements",
    uploadedBy: "Sarah Smith",
    userId: "user2",
    url: "#",
    thumbnail: null
  },
  {
    id: "img5",
    name: "Color Scheme Options",
    category: "Color Schemes",
    projectId: "p3",
    project: "Corporate Office Revamp",
    date: "2023-09-05",
    type: "PNG",
    size: "2.7 MB",
    tags: ["colors", "palette", "corporate"],
    description: "Color options for the office spaces",
    uploadedBy: "Alex Jones",
    userId: "user1",
    url: "#",
    thumbnail: null
  },
  {
    id: "img6",
    name: "Bathroom Fixtures",
    category: "Product Photos",
    projectId: "p4",
    project: "Luxury Apartment Redesign",
    date: "2023-09-10",
    type: "JPG",
    size: "6.3 MB",
    tags: ["bathroom", "fixtures", "products"],
    description: "Selected bathroom fixtures and fittings",
    uploadedBy: "Robert Lee",
    userId: "user3",
    url: "#",
    thumbnail: null
  },
  {
    id: "img7",
    name: "Furniture Layout",
    category: "Space Planning",
    projectId: "p3",
    project: "Corporate Office Revamp",
    date: "2023-09-15",
    type: "PNG",
    size: "4.9 MB",
    tags: ["layout", "furniture", "planning"],
    description: "Furniture arrangement plan for open office",
    uploadedBy: "Sarah Smith",
    userId: "user2",
    url: "#",
    thumbnail: null
  },
  {
    id: "img8",
    name: "Lighting Concepts",
    category: "Lighting",
    projectId: "p5",
    project: "Restaurant Interior",
    date: "2023-09-20",
    type: "JPG",
    size: "5.5 MB",
    tags: ["lighting", "concept", "restaurant"],
    description: "Lighting design concepts for dining area",
    uploadedBy: "Alex Jones",
    userId: "user1",
    url: "#",
    thumbnail: null
  }
];

export type Image = typeof initialImages[0];

interface ImagesState {
  images: Image[];
  selectedImage: Image | null;
  loading: boolean;
  error: string | null;
}

const initialState: ImagesState = {
  images: initialImages,
  selectedImage: null,
  loading: false,
  error: null
};

export const imagesSlice = createSlice({
  name: 'images',
  initialState,
  reducers: {
    getImages: (state) => {
      state.loading = false;
      state.error = null;
    },
    setSelectedImage: (state, action: PayloadAction<string>) => {
      state.selectedImage = state.images.find(image => image.id === action.payload) || null;
    },
    clearSelectedImage: (state) => {
      state.selectedImage = null;
    },
    addImage: (state, action: PayloadAction<Omit<Image, 'id'>>) => {
      const newImage = {
        ...action.payload,
        id: `img${state.images.length + 1}`,
        date: new Date().toISOString().split('T')[0]
      };
      state.images.push(newImage);
    },
    updateImage: (state, action: PayloadAction<{ id: string; image: Partial<Image> }>) => {
      const { id, image } = action.payload;
      const index = state.images.findIndex(img => img.id === id);
      if (index !== -1) {
        state.images[index] = { ...state.images[index], ...image };
        if (state.selectedImage?.id === id) {
          state.selectedImage = state.images[index];
        }
      }
    },
    deleteImage: (state, action: PayloadAction<string>) => {
      state.images = state.images.filter(image => image.id !== action.payload);
      if (state.selectedImage?.id === action.payload) {
        state.selectedImage = null;
      }
    },
    updateImageTags: (state, action: PayloadAction<{ id: string; tags: string[] }>) => {
      const { id, tags } = action.payload;
      const image = state.images.find(img => img.id === id);
      if (image) {
        image.tags = tags;
      }
    }
  }
});

export const { 
  getImages, 
  setSelectedImage, 
  clearSelectedImage, 
  addImage, 
  updateImage, 
  deleteImage,
  updateImageTags
} = imagesSlice.actions;

export const selectAllImages = (state: RootState) => state.images.images;
export const selectSelectedImage = (state: RootState) => state.images.selectedImage;
export const selectImageById = (id: string) => (state: RootState) => 
  state.images.images.find(image => image.id === id);
export const selectImagesByProject = (projectId: string) => (state: RootState) => 
  state.images.images.filter(image => image.projectId === projectId);
export const selectImagesByCategory = (category: string) => (state: RootState) => 
  state.images.images.filter(image => image.category === category);
export const selectImagesByTag = (tag: string) => (state: RootState) => 
  state.images.images.filter(image => image.tags.includes(tag));

export default imagesSlice.reducer;
