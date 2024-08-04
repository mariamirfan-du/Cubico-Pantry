
"use client"
import { useState, useEffect } from "react"
import { firestore } from "@/firebase";
import { Box, Button, Modal, Stack, TextField, Typography, Autocomplete } from "@mui/material"
import { collection, doc, getDocs, getDoc, query, deleteDoc, setDoc, addDoc } from "firebase/firestore";
// import Autocomplete from "@mui/material";

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  
  const updateInventory = async() => {
    const snapshot = query(collection(firestore, "inventory"))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc)=>{
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      })
    })
    
    setInventory(inventoryList);
    setFilteredItems(inventoryList);
  }
  
  const addItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, {quantity: quantity + 1})
    } else {
      await setDoc(docRef, {quantity: 1})
    }
    
    await updateInventory()
  }
  
  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      
      if (quantity === 1){
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, {quantity: quantity - 1})
      }
    }
    
    await updateInventory()
  }

  const handleSearch = (event, value) => {
    if (value) {
      setFilteredItems(inventory.filter(item => item.name.toLowerCase().includes(value.toLowerCase())));
    } else {
      setFilteredItems(inventory);
    }

    console.log(inventory)
  };
  
  function getAllPantryItems(){
    const pantryItems = []

    inventory.map(({name, quantity}) => {
      pantryItems.push(name)
    })

    return pantryItems
  }

  useEffect(() => {
    updateInventory();
  }, [])

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  return (
    // main box
    <Box
      width="100%"
      height="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      bgcolor="#000000"
      gap={2}
      sx={{
        minHeight: '100vh',
        // overflow: 'hidden', // Prevent overflow
        paddingTop: '100px',
      }}
    >
      {/* -----------------------------------navbar starts----------------------------------------------------------- */}
      <Box
      width="100%"
      height="120px"
      bgcolor="#222222"
      color="#e3e3e3"
      paddingLeft={4}
      paddingRight={4}
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      // marginBottom={0}
      position="fixed"
      top={0}w
      right={0}

    >
      <Typography variant="h4" sx={{ ml: 10 }} fontFamily="roboto" color="#fff">
        Cubico Pantry
      </Typography>
      <Autocomplete
        disablePortal
        id="combo-box-demo"
        options={getAllPantryItems()}
        sx={{ width: 300 }}
        onChange={handleSearch}
        renderInput={(params) => (<TextField {...params} label="Search Items" variant="outlined"
          sx={{
            borderRadius: '70px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '70px',
              '& fieldset': {
                borderRadius: '70px',
                borderColor: '#193D5A',
                borderWidth:'2.5px' 
              },
              '&:hover fieldset': {
                borderColor: '#193D5A',
                borderWidth:'2.5px' 
              },
              '&.Mui-focused fieldset': {
                borderColor: '#193D5A', 
                borderWidth:'2.5px ' 
              },
            },
            '& .MuiInputLabel-root': {
              color: '#fff', // Label color
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#fff', // Label color when focused
            },
          }}
        />

        )}
      />
    </Box>
      {/* -----------------------------------navbar ends----------------------------------------------------------- */}
      {/* -----------------------------------the add item popup starts----------------------------------------------------------- */}
      <Modal open={open} onClose={handleClose}>
        <Box 
        position="absolute"
        top="50%" left="50%" 
        width={400} 
        bgcolor="white" 
        border="2px solid #000" 
        boxShadow={24} 
        p={4} 
        display="flex" 
        flexDirection="column" 
        gap={3}
        sx={{
          transform: "translate(-50%, -50%)",
        }}
        >
          <Typography variant="h6">Add Items</Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField
            variant="outlined"
            fullWidth
            value={itemName}
            onChange={(e) => {
              setItemName(e.target.value)
            }}
            label="Item Name"
            ></TextField>
            <Button
            variant="outlined"
            onClick={() => {
              addItem(itemName)
              setItemName("")
              handleClose()
            }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      {/* -----------------------------------the add item popup ends----------------------------------------------------------- */}
      <Box 
      sx ={{
        display:"flex",
        flexDirection:"column",
        alignItems:"center",
        justifyContent:"center",
      }}
      >

        <Box
        sx={{ textAlign:'center', padding:'20px', borderRadius:'8px' ,  bgcolor:"#172A39", width: { xs: "100%", md: "800px" },
          height:"140px" , marginTop:'50px' }}
        >
          <Typography variant="h4" color="#ffff"  sx={{ color: '#fff', marginBottom: '20px' }}>INVENTORY ITEMS</Typography>
          <Button
            variant="contained"
            onClick={() => {
              handleOpen()   
            }}

            sx={{
              bgcolor:'#0A416E',
              color:'#fff',
              '&:hover': { backgroundColor: '#174469 !important'},
              height:'50px',
              width:'200px',
              borderRadius: '20px',
              fontSize:"17px"
            }}
          >
            Add New Item
          </Button>
        </Box>  
      </Box>

      <Stack 
        width={{ xs: "100%", md: "800px" }}
        height="300px"
        spacing={2}
        overflow="auto"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center', 
          marginBottom: '20px'
        }}
        >
          {filteredItems.map(({name, quantity}) => (
          <Box
            key={name}
            width="70%"
            minHeight="80px"
            display={'flex'}
            justifyContent={'space-between'}
            alignItems={'center'}
            bgcolor={'#0A416E'}
            paddingX={5}
            sx={{ 
              borderRadius: '20px',
             }} 
          >
            <Typography variant={'h4'} color={'#fff'} textAlign={'left'} sx={{ flex: 1 }}> 
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </Typography>

            <Box display={'flex'} alignItems={'center'}>
              <Button variant="text" onClick={() => removeItem(name)} sx={{ minWidth: '20px' }}>
                <Typography variant="h3" color='#fff'>-</Typography>
              </Button>
            
              <Typography variant={'h6'} color={'#fff'} textAlign={'center'} mx ={3}>
                {quantity}
              </Typography>
            
              <Button variant="text" onClick={() => addItem(name)} sx={{ minWidth: '20px' }}>
                <Typography variant="h4" color='#fff'>+</Typography>
              </Button>
            </Box>
          </Box>
        ))}
        </Stack>
    </Box>
  );
}



