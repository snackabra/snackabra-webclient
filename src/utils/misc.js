import { amber, blue, blueGrey, brown, common, cyan, deepOrange, deepPurple, green, grey, indigo, lightBlue, lightGreen, lime, orange, pink, purple, red, teal, yellow } from '@mui/material/colors';

export const getColorFromId = (id) => {
    let sumChars = 0;
    for (let i = 0; i < id.length; i++) {
      sumChars += id.charCodeAt(i);
    }

    const colors = [
      amber,
      blue,
      blueGrey,
      brown,
      common,
      cyan,
      deepOrange,
      deepPurple,
      green,
      grey,
      indigo,
      lightBlue,
      lightGreen,
      lime, 
      orange,
      pink, 
      purple,
      red,
      teal,
      yellow
    ];

    const keys = Object.keys(colors[sumChars % colors.length]);
    return colors[sumChars % colors.length][keys[sumChars % keys.length]];
  }