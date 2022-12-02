import React from 'react'
import { Typography } from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';

const RenderTime = (props) => {

  let Sending = () => {
    return (
      <>
        <CircularProgress color='inherit' size={12} />
        &nbsp;sending...
      </>
    )
  };

  let return_str = '';
  try {
    // Reference from https://stackoverflow.com/questions/32199998/check-if-date-is-today-was-yesterday-or-was-in-the-last-7-days
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let dt = new Date(props.currentMessage.createdAt);
    let date = dt.getDate();
    let month = months[dt.getMonth()];
    let diffDays = new Date().getDate() - date;
    let diffMonths = new Date().getMonth() - dt.getMonth();
    let diffYears = new Date().getFullYear() - dt.getFullYear();

    if (diffYears === 0 && diffDays === 0 && diffMonths === 0) {
      return_str = "Today";
    } else if (diffYears === 0 && diffDays === 1) {
      return_str = "Yesterday";
    } else if (diffYears >= 1) {
      return_str = month + " " + date + ", " + dt.getFullYear();
    } else {
      return_str = month + " " + date;
    }
    return_str += ", " + dt.toLocaleTimeString([], { hour12: true, hour: 'numeric', minute: 'numeric' })
  } catch (e) {
    console.log(e);
    return_str = ''
  }
  return (<div style={{
    marginLeft: 10,
    marginRight: 10,
  }}
  >
    <Typography
      variant={'body2'}
      style={{
        backgroundColor: 'transparent',
        color: props.currentMessage.whispered || props.position === 'left' ? '#aaa' : 'white'
      }}>
      {props.currentMessage._id.match(/^sending_/) ? <Sending /> : return_str}
    </Typography>
  </div>);
}

export default RenderTime;
