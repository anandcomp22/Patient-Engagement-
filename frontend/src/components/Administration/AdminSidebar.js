import {
  Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton,
  Box, Tooltip, Typography, Divider
} from "@mui/material";
import {
  Dashboard, LocalHospital, People, History, VerifiedUser,
  Payments, BarChart, LoginOutlined, Settings,
  ChevronLeft as ChevronLeftIcon, Menu as MenuIcon,
} from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Aidme from "../Doctor/icons/logo.png";

const MENU = [
  { text:"Dashboard",    icon:<Dashboard />,    path:"/admin/dashboard" },
  { text:"Doctors",      icon:<LocalHospital />, path:"/admin/doctors"   },
  { text:"Patients",     icon:<People />,        path:"/admin/patients"  },
  { text:"Verification", icon:<VerifiedUser />,  path:"/admin/verify"    },
  { text:"Activity Logs",icon:<History />,       path:"/admin/logs"      },
  { text:"Payments",     icon:<Payments />,      path:"/admin/payments"  },
  { text:"Analytics",    icon:<BarChart />,      path:"/admin/analytics" },
];

const FOOTER = [
  { text:"Settings", icon:<Settings />,      path:"/admin/settings" },
  { text:"Logout",   icon:<LoginOutlined />, path:"/admin/auth/login", logout:true },
];

const AdminSidebar = ({ open, onToggle, isMobile, onMobileClose }) => {
  const { pathname } = useLocation();
  const navigate     = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/auth/login");
  };

  const handleNavClick = () => {
    if (isMobile && onMobileClose) onMobileClose();
  };

  const NavItem = ({ item, isFooter }) => {
    const active = pathname === item.path;
    const handleClick = () => {
      if (isFooter && item.logout) {
        handleLogout();
      }
      handleNavClick();
    };

    return (
      <Tooltip title={!open ? item.text : ""} placement="right" key={item.text}>
        <ListItem
          button
          component={isFooter && item.logout ? "div" : Link}
          to={!(isFooter && item.logout) ? item.path : undefined}
          onClick={handleClick}
          sx={{
            mb: 0.5,
            mx: 1,
            borderRadius: "12px",
            px: open ? 2 : 1.2,
            py: 1,
            position: "relative",
            overflow: "hidden",
            cursor: "pointer",
            transition: "all 0.2s",
            bgcolor: active ? "rgba(255,255,255,0.2)" : "transparent",
            "&::before": active ? {
              content: '""',
              position: "absolute",
              left: 0, top: "20%", bottom: "20%",
              width: 4, bgcolor: "#fff",
              borderRadius: "0 4px 4px 0"
            } : {},
            "& .MuiListItemIcon-root": {
              color: active ? "#fff" : "rgba(255,255,255,0.75)",
              minWidth: 0,
              mr: open ? 2 : "auto",
              justifyContent: "center",
              transition: "color 0.2s"
            },
            "& .MuiListItemText-root .MuiTypography-root": {
              color: active ? "#fff" : "rgba(255,255,255,0.8)",
              fontWeight: active ? 700 : 500,
              opacity: open ? 1 : 0,
              transition: "opacity 0.3s",
              whiteSpace: "nowrap",
              fontSize: 14,
            },
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.15)",
              "& .MuiListItemIcon-root": { color: "#fff" },
              "& .MuiListItemText-root .MuiTypography-root": { color: "#fff", opacity: 1 },
            },
          }}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItem>
      </Tooltip>
    );
  };

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? open : true}
      onClose={onToggle}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: isMobile ? 260 : (open ? 240 : 64),
          position: "fixed",
          height: "100vh",
          transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
          background: "linear-gradient(135deg, #bee3fdff 0%, #008cffff 100%)",
          color: "#fff",
          boxShadow: "4px 0 24px rgba(0,0,0,0.2)",
          overflowX: "hidden",
          borderRight: "none",
        }
      }}
    >
      {/* Toggle Button */}
      <Box sx={{ height:64, display:"flex", alignItems:"center", justifyContent: open ? "flex-end" : "center", px:1 }}>
        <IconButton onClick={onToggle}
          sx={{ bgcolor:"rgba(255,255,255,0.1)", color:"#fff", "&:hover":{ bgcolor:"rgba(255,255,255,0.2)" } }}>
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      {/* Logo */}
      <Box sx={{ display:"flex", flexDirection:"column", alignItems:"center", mb:2, px:1 }}>
        <img src={Aidme} alt="AidME" style={{ maxWidth: open ? 110 : 36, transition:"max-width 0.3s ease", borderRadius:8 }} />
      </Box>

      {/* Main Menu */}
      <List sx={{ flex:1, pt:0 }}>
        {MENU.map(item => <NavItem key={item.text} item={item} />)}
      </List>

      {/* Divider */}
      <Divider sx={{ borderColor:"rgba(255,255,255,0.1)", mx:2, my:1 }} />

      {/* Footer Items */}
      <List sx={{ pb:2 }}>
        {FOOTER.map(item => <NavItem key={item.text} item={item} isFooter />)}
      </List>
    </Drawer>
  );
};

export default AdminSidebar;
