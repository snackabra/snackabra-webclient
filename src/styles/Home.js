import {styled} from '@mui/material/styles';
import {Box, Card} from "@mui/material";
import theme from '../theme'

export const StyledHome = styled(Box)(() => ({
  width: '100%',
  display: 'grid',
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    background: 'linear-gradient(0deg, rgba(255,255,255,1) 90%, rgba(244,244,246,1) 90%)',
    h4:{
      lineHeight: '24px',
      fontSize: '20px',
      fontWeight: 400,
      paddingBottom: theme.spacing(2)
    },
    '& .aboutBackgroundImage': {
      height: 260
    }

  },
  [theme.breakpoints.up('xl')]: {
    '& .aboutBackgroundImage': {
      width: '100%',
      top: -150
    }

  },
  // Custom query for very large screen
  [theme.breakpoints.between(2200, 2560)]: {
    '& .aboutBackgroundImage': {
      width: '100%',
      top: -400
    }

  }
}));
