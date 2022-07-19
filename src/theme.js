import { createTheme, experimental_sx as sx } from "@mui/material/styles"

let theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      xmd: 1026,
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
        focused: sx({
          color: '#ff5c42 !important',
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        focused: sx({
          color: '#ff5c42 !important',
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
