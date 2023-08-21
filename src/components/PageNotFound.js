import * as React from 'react';
import {Link} from 'react-router-dom'
import { Button } from '@mui/material'

const data = `<object type="image/svg+xml" data="https://cdn.svgator.com/images/2022/01/404-svg-animation.svg" alt="Kitty Yarn Play 404 SVG animation example" img="" width="100%"></object>`
export default function PageNotFound(props) {

    return (
        <div>
            <div style={{ width: '100%', height: '100vh', backgroundColor: '#262a37' }} dangerouslySetInnerHTML={{ __html: data }}>


            </div>
            <Button component={Link} to={'/'} sx={{position: 'fixed', top: 72, left: 8, textTransform: 'none'}} variant="text">Go Home</Button>
        </div>
    );
}
