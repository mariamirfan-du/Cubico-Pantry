"use client";
import { useState, useEffect, useCallback , useRef } from "react";
import { firestore } from "@/firebase";
import {
  Box, Button, Modal, Stack, TextField, Typography,
  Autocomplete, Drawer, Card, CardMedia, CardContent
} from "@mui/material";
import axios from 'axios';
import {
  collection, doc, getDocs, getDoc, query,
  deleteDoc, setDoc
} from "firebase/firestore";

// OpenAI API key and endpoint (make sure to replace 'YOUR_OPENAI_API_KEY' with your actual key)
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';
const PEXELS_API_KEY = 'YOUR_PEXELS_API_KEY'; // Replace with your Pexels API key

const fetchImageUrl = async (itemName) => {
  try {
    const response = await axios.get(`https://api.pexels.com/v1/search?query=${itemName}&per_page=1`, {
      headers: {
        Authorization: `Bearer ${PEXELS_API_KEY}`,
      },
    });
    return response.data.photos[0]?.src?.medium || 'default_image_url'; // Fallback to a default image
  } catch (error) {
    console.error("Error fetching image URL:", error);
    return 'default_image_url'; // Fallback to a default image in case of error
  }
}

const getCategoryItemsFromAI = async (category) => {
  try {
    const response = await axios.post('/api/get-category-items', { category }, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      }
    });
    return response.data.items;
  } catch (error) {
    console.error("Error getting category items:", error);
    return [];
  }
}

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const updateInventory = useCallback(async () => {
    try {
      const snapshot = query(collection(firestore, "inventory"));
      const docs = await getDocs(snapshot);
      const inventoryList = docs.docs.map(doc => ({ name: doc.id, ...doc.data() }));
      setInventory(inventoryList);
      setFilteredItems(inventoryList);
      setCategories([...new Set(inventoryList.map(item => item.category))]);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  }, []);

  useEffect(() => {
    updateInventory();
  }, [updateInventory]);

  const addItem = async () => {
    try {
      if (!category) {
        alert('Please select a category.');
        return;
      }
      const imageUrl = await fetchImageUrl(itemName);
      const docRef = doc(collection(firestore, "inventory"), itemName);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        await setDoc(docRef, { quantity: quantity + 1 }, { merge: true });
      } else {
        await setDoc(docRef, { quantity: 1, category, imageUrl });
      }
      updateInventory();
      handleClose();
    } catch (error) {
      console.error("Error adding item:", error);
    }
  }

  const deleteItem = async (item) => {
    try {
      const docRef = doc(collection(firestore, "inventory"), item);
      await deleteDoc(docRef);
      updateInventory();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }

  const handleSearch = (event, value) => {
    setFilteredItems(value 
      ? inventory.filter(item => item.name.toLowerCase().includes(value.toLowerCase()))
      : inventory
    );
  }

  const handleCategoryChange = async (category) => {
    setCategory(category);
    if (category === "all") {
      setFilteredItems(inventory);
    } else {
      setFilteredItems(inventory.filter(item => item.category === category));
    }
    setDrawerOpen(false); // Close the sidebar after selection
  }

  const getAllPantryItems = () => inventory.map(item => item.name);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setItemName("");
    setCategory(""); // Reset category selection when closing the modal
  };

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const adjustQuantity = async (item, adjustment) => {
    try {
      const docRef = doc(collection(firestore, "inventory"), item.name);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        if (quantity + adjustment > 0) {
          await setDoc(docRef, { quantity: quantity + adjustment }, { merge: true });
          updateInventory();
        }
      }
    } catch (error) {
      console.error("Error adjusting quantity:", error);
    }
  };

  const videoRef = useRef(null);
  const photoRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  const openCamera = async () => {
    setIsCameraOpen(true);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  };

  const closeCamera = () => {
    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();

    tracks.forEach(track => {
      track.stop();
    });

    videoRef.current.srcObject = null;
    setIsCameraOpen(false);
  };

  const takePicture = () => {
    const width = 640;
    const height = 480;
    const context = photoRef.current.getContext('2d');
    photoRef.current.width = width;
    photoRef.current.height = height;
    context.drawImage(videoRef.current, 0, 0, width, height);
    const dataURL = photoRef.current.toDataURL('image/png');
    setImageSrc(dataURL);
  };

  



  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      bgcolor="#feebe1" // Background color
      gap={2}
      sx={{ minHeight: '100vh', paddingTop: '100px' }}
    >
      <Box
        width="100%"
        height="120px"
        bgcolor="#b7b5b3" // Primary color
        color="#000000" // Text color
        paddingLeft={4}
        paddingRight={4}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        position="fixed"
        top={0}
        right={0}
        sx={{
            zIndex:1000
        }}
      >
        <Typography variant="h4" sx={{ ml: 10 }} fontFamily="roboto">
          Cubico Pantry
        </Typography>
        <Autocomplete
          disablePortal
          id="combo-box-demo"
          options={getAllPantryItems()}
          sx={{ width: 300 }}
          onChange={handleSearch}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Items"
              variant="outlined"
              sx={{
                borderRadius: '70px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '70px',
                  '& fieldset': {
                    borderRadius: '70px',
                    borderColor: '#000000', // Text color
                    borderWidth: '2.5px',
                  },
                  '&:hover fieldset': {
                    borderColor: '#000000', // Text color
                    borderWidth: '2.5px',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#000000', // Text color
                    borderWidth: '2.5px',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#000000', // Text color
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#000000', // Text color
                },
              }}
            />
          )}
        />
{/* ----------------------------------------------------navbar ends-------------------------------------------------------------------- */}
        <Button onClick={toggleDrawer(true)} variant="outlined" sx={{ color: '#000000' }}> {/* Text color */}
          Categories
        </Button>
      </Box>
      
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box
          width={250}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
          sx={{ padding: 2 }}
        >
          <Typography variant="h6" sx={{ marginBottom: 2 }}>
            Categories
          </Typography>
          <Stack spacing={1}>
            {['all', 'vegetables', 'fruits', 'herbs and spices', 'meat items', 'dairy', 'sauces', 'oils', 'baking', 'canned and prepared'].map(cat => (
              <Button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                sx={{ textAlign: 'left', color: '#000000', justifyContent: 'flex-start' }} // Text color
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </Stack>
        </Box>
      </Drawer>
      
      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={400}
          bgcolor="#feebe1" // Background color
          border="2px solid"
          borderColor="#000000" // Text color
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{ transform: "translate(-50%, -50%)" }}
        >
          <Typography variant="h6" >Add Item</Typography>
          <Stack width="100%" direction="column" spacing={2}>
            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              label="Item Name"
            />
            <Autocomplete
              options={['vegetables', 'fruits', 'herbs and spices', 'meat items', 'dairy', 'sauces', 'oils', 'baking', 'canned and prepared']}
              value={category}
              onChange={(event, newValue) => setCategory(newValue)}
              renderInput={(params) => <TextField {...params} label="Category" variant="outlined" />}
            />
            <Button onClick={addItem} variant="contained" sx={{ bgcolor: '#b7b5b3', color: '#000000' }}> {/* Primary color and Text color */}
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Box display='flex' justifyContent="space-between" width={400}>
      <Typography variant="h5" sx={{ mt: "50px", color: '#000000' }}> {/* Text color */}
        {category && category !== "all" ? `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}` : "All Items"}
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        sx={{ marginTop: '40px', bgcolor: '#b7b5b3', color: '#000000' }} // Primary color and Text color
      >
        Add Item
      </Button>

      <Button
        variant="contained"
        color="primary"
        onClick={takePicture}
        sx={{ marginTop: '40px', bgcolor: '#b7b5b3', color: '#000000' }} // Primary color and Text color
      >
        scan
      </Button>

      </Box>

      <Stack spacing={2} width="60%" marginTop="50px">
        {filteredItems.map((item) => (
          <Card key={item.name} sx={{ display: 'flex', flexDirection: 'row', width: '100%', borderRadius: '8px', boxShadow: 3, bgcolor: '#e2beb1' }}> {/* Secondary color */}
            <CardMedia
              component="img"
              sx={{ width: 150, objectFit: 'cover', borderRadius: '8px' }}
              image={item.imageUrl || 'default_image_url'} // Fallback to default image if not available
              alt={item.name}
            />
            <CardContent sx={{ flex: '1', padding: '16px' }}>
              <Typography variant="h6" color="#000000">{item.name}</Typography> {/* Text color */}
              <Typography variant="body2" color="text.secondary">
                Quantity: 
                <Button
                  onClick={() => adjustQuantity(item, -1)}
                  sx={{ mx: 1, minWidth: '32px', bgcolor: '#e2beb1' }} // Accent color
                >
                  -
                </Button>
                {item.quantity}
                <Button
                  onClick={() => adjustQuantity(item, 1)}
                  sx={{ mx: 1, minWidth: '32px', bgcolor: '#e2beb1'  }} // Accent color
                >
                  +
                </Button>
              </Typography>
            </CardContent>
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              padding="8px"
              gap={1}
            >
              <Button
                variant="contained"
                color="error"
                onClick={() => deleteItem(item.name)}
                sx={{ bgcolor: '#b7b5b3', color: '#000000' }} // Primary color and Text color
              >
                Delete
              </Button>
            </Box>
          </Card>
        ))}
      </Stack>
      
    </Box>
  );
}
