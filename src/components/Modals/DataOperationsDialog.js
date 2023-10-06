import React from "react";
import PropTypes from 'prop-types';
import SwipeableViews from 'react-swipeable-views/src/SwipeableViews.js';
import { useTheme, Tabs, Tab, Typography, Box, Divider} from '@mui/material';
import ImportRoomKeys from "../Rooms/ImportRoomKeys.js";
import ExportRoomKeys from "../Rooms/ExportRoomKeys.js";
import DownloadRoomData from "../Rooms/DownloadRoomData.js";
import ResponsiveDialog from "../ResponsiveDialog.js";
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}

export default function DataOperationsDialog(props) {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);
  const [open, setOpen] = React.useState(props.open);

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleChangeIndex = (index) => {
    setValue(index);
  };

  return (
    <ResponsiveDialog title={'Data Management'} open={open} onClose={props.onClose} showActions fullScreen>
      <Tabs
        value={value}
        onChange={handleChange}
        indicatorColor="primary"
        textColor="inherit"
        variant="fullWidth"
        aria-label="full width tabs example"
      >
        <Tab label="Keys" {...a11yProps(0)} />
        <Tab label="Downloads" {...a11yProps(1)} />
        {/* <Tab label="Uploads" {...a11yProps(2)} /> */}
      </Tabs>
      <SwipeableViews
        axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
        index={value}
        onChangeIndex={handleChangeIndex}
      >
        <TabPanel value={value} index={0} dir={theme.direction}>
          <Typography variant={'h6'} gutterBottom>Export Keys</Typography>
          <ExportRoomKeys onDone={() => {
            props.onClose()
          }} />
          <Divider sx={{ mt: 2, mb: 2 }} />
          <Typography variant={'h6'} gutterBottom>Import Keys</Typography>
          <ImportRoomKeys onDone={() => {
            props.onClose()
          }} />
        </TabPanel>
        <TabPanel value={value} index={1} dir={theme.direction}>
          <Typography variant={'h6'} gutterBottom>Download Data</Typography>
          <DownloadRoomData />
        </TabPanel>
        {/* <TabPanel value={value} index={2} dir={theme.direction}>
          <Typography variant={'h6'} gutterBottom>Upload Data</Typography>
        </TabPanel> */}
      </SwipeableViews>
    </ResponsiveDialog>
  );
}
