"use client"; // Mark this as a Client Component

import { Box, Button, Modal, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
const Page = () => {

  const router = useRouter()

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundImage: "url('home_bg4.jpg')", // Replace with your image URL
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)", // Half-transparent overlay
          zIndex: 1,
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          color: "white",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 200, // Set a fixed height for the image container
          }}
        >
          <Image
            src="/logo_2.png" // Replace with your image URL
            alt="Your Logo"
            width={400} // Set the desired width
            height={400} // Set the desired height
            style={{ maxWidth: '100%', height: 'auto' }} // Ensure the image is responsive
          />
        </Box>
          
        <Typography variant="h5" component="p" sx={{ marginTop: 2 }}>
          CUBICO PANTRY
        </Typography>
        <Typography variant= "h6" component="p" sx={{ marginTop: "auto", fontStyle: 'italic' }}>The only way to manage</Typography>
        <Button
          variant="contained"
          sx={{ bgcolor:"#043A4A !important",color:"#fff",'&:hover': { backgroundColor: '#0A416E !important'},marginTop: 2}}
          onClick={() => router.push('/inventory')}
        >
          Lets Manage
        </Button>

      </Box>
    </Box>
  );
};

export default Page;
