import { createTheme } from "@mui/material"

let theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536
    },
  },
})
theme = createTheme(theme, {
  status: {
    danger: "#ff0000",
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        "root": {
          "&.Mui-focused": {
            "borderColor": "#ff5c42 !important"
          }
        }
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        "root": {
          "&.Mui-focused": {
            "borderColor": "#ff5c42 !important"
          }
        }
      },
    },
    MuiButton: {
      styleOverrides: {
        // Name of the slot
        root: ({ ownerState }) => ({
          ...(ownerState.variant === 'contained' &&
            ownerState.color === 'primary' && {
            backgroundColor: '#FF5C42',
            color: '#2D2D2D',
            '&:hover': {
              color: '#2D2D2D',
              backgroundColor: '#DB362F',
            },
          }),
          ...(ownerState.variant === 'text' &&
            ownerState.color === 'primary' && {
            color: '#FF5C42',
            '&:hover': {
              color: '#FF5C42',
              backgroundColor: 'rgba(255, 92, 66, 0.1)',
            },
          }),
          ...(ownerState.variant === 'outlined' &&
            ownerState.color === 'primary' && {
            color: '#FF5C42',
            borderColor: '#FF5C42',
            '&:hover': {
              color: '#FF5C42',
              borderColor: '#FF5C42',
              backgroundColor: 'rgba(255, 92, 66, 0.1)',
            },
          }),
          ...(ownerState.variant === 'contained' &&
            ownerState.color === 'secondary' && {
            backgroundColor: '#EFEFEF',
            color: '#2D2D2D',
            '&:hover': {
              color: '#2D2D2D',
              backgroundColor: '#BEBEBE',
            },
          }),
          ...(ownerState.variant === 'text' &&
            ownerState.color === 'secondary' && {
            color: '#EFEFEF',
            '&:hover': {
              color: '#EFEFEF',
              backgroundColor: 'rgba(239, 239, 239, 0.1)',
            },
          }),
          ...(ownerState.variant === 'outlined' &&
            ownerState.color === 'secondary' && {
            color: '#EFEFEF',
            borderColor: '#EFEFEF',
            '&:hover': {
              color: '#EFEFEF',
              borderColor: '#EFEFEF',
              backgroundColor: 'rgba(239, 239, 239, 0.1)',
            },
          }),
          ...(ownerState.variant === 'contained' &&
            ownerState.color === 'gray' && {
            backgroundColor: '#6c757d',
            color: '#fff',
            '&:hover': {
              color: '#fff',
              backgroundColor: '#5c636a',
            },
          }),
          ...(ownerState.variant === 'contained' &&
            ownerState.color === 'blue' && {
            backgroundColor: '#0d6efd',
            borderColor: '#0d6efd',
            color: '#fff',
            '&:hover': {
              color: '#fff',
              backgroundColor: '#0b5ed7',
              borderColor: '#0a58ca'
            },
          }),
        }),
      },
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      'sans-serif'
    ].join(','),
    h2: {},
    h3: {},
    h4: {},
    h5: {},
    h6: {},
    body1: {},
    body2: {}
  },
})

export default theme
