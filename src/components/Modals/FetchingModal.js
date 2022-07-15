import * as React from "react"


const FetchingModal = () => {
  return (
    <div id='image_overlay'>
    <div id="preview_img" className="center"><h2>Fetching image....</h2></div>
    <button className="close-btn" onClick={() => {
      document.getElementById('image_overlay').style.display = 'none';
      document.getElementById('preview_img').classList.add('center');
      document.getElementById('preview_img').innerHTML = '<h2>Fetching image...</h2>';
    }}>&#10006;</button>
  </div>
  )
}

export default FetchingModal;
