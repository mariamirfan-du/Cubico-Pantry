"use client";
import { useState, useEffect, useCallback , useRef } from "react";
import { firestore } from "@/firebase";
import {Box, Button, Modal, Stack, TextField, Typography,Autocomplete, Drawer, Card, CardMedia, CardContent} from "@mui/material";
import axios from 'axios';
import {collection, doc, getDocs, getDoc, query,deleteDoc, setDoc} from "firebase/firestore";



// const PEXELS_API_KEY = createClient(process.env.NEXT_PUBLIC_PEXELS_API_KEY);

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
  const [openCamera, setOpenCamera] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [ quantity , setQuantity ] = useState("")
  const videoRef = useRef(null);
  const canvasRef = useRef(null);


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
    setQuantity("")
    setCategory("");
    setImageSrc("");// Reset category selection when closing the modal
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


  const openCameraModal = () => setOpenCamera(true);

  //Function for closing camera modal 

  const closeCameraModal = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
    videoRef.current.srcObject = null;
    setOpenCamera(false);
  };
//Function for capturing pictures 
  const captureImage = () => {
    const context = canvasRef.current?.getContext("2d");
    if (videoRef.current && context) {
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageDataURL = canvasRef.current.toDataURL("image/png");
      setImageSrc(imageDataURL);
      closeCameraModal();
      handleOpen();
    }
  };

  useEffect(() => {
    if (openCamera) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        })
        .catch((err) => {
          console.error("Error accessing camera: ", err);
        });
    }
  }, [openCamera]);

//Function to update items in inventory 
  const uploadImage = async () => {
    if (!itemName || !quantity || !category) {
      alert("Please provide all details before uploading.");
      return;
    }

    try {
      const docRef = doc(collection(firestore, "inventory"), itemName);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { quantity: existingQuantity } = docSnap.data();
        await setDoc(docRef, {
          imageUrl: imageSrc,
          name: itemName,
          quantity: existingQuantity + parseInt(quantity, 10),
          category,
          createdAt: new Date()
        }, { merge: true });
      } else {
        await setDoc(docRef, {
          imageUrl: imageSrc,
          name: itemName,
          quantity: parseInt(quantity, 10),
          category,
          createdAt: new Date()
        });
      }
      console.log("Document successfully written!");
      updateInventory();
      handleClose();
      closeCamera();
      setImageSrc(""); 
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };


//Function to delete inventory item
  const deleteItem = async (item) => {
    try {
      const docRef = doc(collection(firestore, "inventory"), item);
      await deleteDoc(docRef);
      updateInventory();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }


// --------------------------------------------Main body starting -------------------------------------------------------//
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
      {/*-----------------------------------------category hamburg closed-----------------------------------------------------  */}


      {/* ----------------------------------------Selected content Title------------------------------------------------------------ */}
      <Box display='flex' justifyContent="space-between" width={400}>
      <Typography variant="h5" sx={{ mt: "50px", color: '#000000'  , display:"flex-start"}}> {/* Text color */}
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
        onClick={openCameraModal}
        sx={{ marginTop: '40px', bgcolor: '#b7b5b3', color: '#000000' }} // Primary color and Text color
      >
        scan
      </Button>
        {/*----------------------------------- Modal for Camera----------------------------------------------------- */}

        <Modal
        open={openCamera}
        onClose={closeCameraModal}
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <Box
          sx={{
            bgcolor: 'white',
            padding: 2,
            borderRadius: 1,
            boxShadow: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Capture Image
          </Typography>
          <video ref={videoRef} autoPlay width="320" height="240" style={{ border: '1px solid black' }} />
          <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }} />
          <Button onClick={captureImage} variant="contained" color="primary" sx={{ marginTop: 2 }}>
            Capture
          </Button>
          <Button onClick={closeCameraModal} variant="contained" color="primary" sx={{marginTop:2}}>close</Button>
        </Box>
      </Modal>
{/* --------------------------------------------Camera Model Ends------------------------------------------------------------- */}

{/* ----------------------------------------------Add Item PopUp----------------------------------------------------------------- */}
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
          
          {imageSrc && (
            <Box sx={{ marginBottom: 2, textAlign: 'center' }}>
              <img src={imageSrc} alt="Captured" style={{ maxWidth: '100%', height: 'auto' }} />
            </Box>
          )}

          <Stack width="100%" direction="column" spacing={2}>

            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              label="Item Name"
            />
             <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                fullWidth
                sx={{ mt: 2 }}
              />
            <Autocomplete
              options={['vegetables', 'fruits', 'herbs and spices', 'meat items', 'dairy', 'sauces', 'oils', 'baking', 'canned and prepared']}
              value={category}
              onChange={(event, newValue) => setCategory(newValue)}
              renderInput={(params) => <TextField {...params} label="Category" variant="outlined" />}
            />
            <Button onClick={uploadImage} variant="contained" sx={{ bgcolor: '#b7b5b3', color: '#000000' }}> {/* Primary color and Text color */}
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
{/* ----------------------------------------------AddItem Pop Up Ends-------------------------------------------------- */}
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
                sx={{ bgcolor: '#b7b5b3', color: '#000000' ,'&:hover': { backgroundColor: '#0A416E !important'}}} // Primary color and Text color
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
