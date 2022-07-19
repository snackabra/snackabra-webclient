import * as React from "react"
import styled from "styled-components";
import { Tab, Tabs } from "@mui/material";
import theme from '../theme'
import { Link } from "react-router-dom";

export const AppBarTabs = styled((props) => (
  <Tabs
    {...props}
    TabIndicatorProps={{ children: <span className="MuiTabs-indicatorSpan" />, sx: { height: 6 } }}
  />
))(() => ({
  '& .MuiTabs-indicator': {
    display: 'flex',
    transition: 'none',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  '& .MuiTabs-indicatorSpan': {
    width: '100%',
    backgroundColor: 'transparent',
  }
}));


export const AppBarTab = styled((props) => <Tab sx={{ px: 0 }} disableRipple {...props} />)(
  () => ({
    letterSpacing: theme.typography.pxToRem(1.25),
    fontWeight: 600,
    lineHeight: theme.typography.pxToRem(16),
    fontSize: theme.typography.pxToRem(16),
    color: '#FFF',
    margin: 0,
    textTransform: 'none',
    opacity: 1,
    '&.Mui-selected': {
      color: '#FFF',
      backgroundColor: '#ff5c42'
    },
    '&.Mui-focusVisible': {
      backgroundColor: '#ff5c42'
    },
    a: {
      color: '#FFF',
      padding: '12px 16px'
    },
    '&:visited': {
      color: '#FFF',
    }
  }),
);

export const AppBarTabLink = styled((props) => {
  return <Link children={props.children} to={props.to} onChange={props.onChange} className={props.className}/>
})(
  (props) => ({
    backgroundColor: props.selected ? '#ff5c42' : 'none',
    '&.Mui-selected': {
      color: '#FFF',
      backgroundColor: '#ff5c42'
    },
    '&.Mui-focusVisible': {
      backgroundColor: '#ff5c42'
    }
  }),
);
