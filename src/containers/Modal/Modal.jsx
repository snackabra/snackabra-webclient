/* 
   Copyright (C) 2019-2021 Magnusson Institute, All Rights Reserved

   "Snackabra" is a registered trademark

   This program is free software: you can redistribute it and/or
   modify it under the terms of the GNU Affero General Public License
   as published by the Free Software Foundation, either version 3 of
   the License, or (at your option) any later version.

   This program is distributed in the hope that it will be useful, but
   WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
   Affero General Public License for more details.

   You should have received a copy of the GNU Affero General Public
   License along with this program.  If not, see www.gnu.org/licenses/

*/


import React from 'react';
import PropTypes from 'prop-types';
import './Modal.css'
const propTypes = {
  id: PropTypes.string.isRequired
};

class JwModal extends React.Component {
  static modals = [];

  static open = (id) => {

    // open modal specified by id
    let modal = JwModal.modals.find(x => x.props.id === id);
    modal.setState({ isOpen: true });
    document.body.classList.add('jw-modal-open');
  }

  static close = (id) => (e) => {
    e.preventDefault()
    // close modal specified by id
    let modal = JwModal.modals.find(x => x.props.id === id);
    modal.setState({ isOpen: false });
    document.body.classList.remove('jw-modal-open');
  }

  constructor(props) {
    super(props);

    this.state = { isOpen: false };

    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    // move element to bottom of page (just before </body>) so it can be displayed above everything else
    document.body.appendChild(this.element);

    // add this modal instance to the modal service so it's accessible from other components
    JwModal.modals.push(this);
  }

  componentWillUnmount() {
    // remove this modal instance from modal service
    JwModal.modals = JwModal.modals.filter(x => x.props.id !== this.props.id);
    this.element.remove();
  }

  handleClick(e) {
    // close modal on background click
    if (e.target.className === 'jw-modal') {
      JwModal.close(this.props.id)(e);
    }
  }

  render() {
    return (
      <div style={{ display: + this.state.isOpen ? '' : 'none' }} onClick={this.handleClick} ref={el => this.element = el}>
        <div className="jw-modal">
          <div className="jw-modal-body">
            {this.props.children}
          </div>
        </div>
        <div className="jw-modal-background"></div>
      </div>
    );
  }
}

JwModal.propTypes = propTypes;

export { JwModal };
