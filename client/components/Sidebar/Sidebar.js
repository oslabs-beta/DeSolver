import React from 'react'
import { SidebarContainer, Icon, CloseIcon, SidebarWrapper, SidebarMenu, SideBtnWrap, SidebarRoute, SidebarLink } from './Sidebar.styled'

const Sidebar = ({ isOpen, toggle}) => {
  return (
    <SidebarContainer isOpen={isOpen} onClick={toggle}>
      <Icon onClick={toggle}>
        <CloseIcon />
      </Icon>
      <SidebarWrapper>
        <SidebarMenu>
          <SidebarLink to='/learn' onClick={toggle}>
            Learn
          </SidebarLink>
          <SidebarLink to='/code' onClick={toggle}>
            Code
          </SidebarLink>
          <SidebarLink to='/community' onClick={toggle}>
            Community
          </SidebarLink>
          <SidebarLink to='/about' onClick={toggle}>
            About
          </SidebarLink>
        </SidebarMenu>
        <SideBtnWrap>
          <SidebarRoute to='/signup'>Sign Up</SidebarRoute>
        </SideBtnWrap>
      </SidebarWrapper>
    </SidebarContainer>
  )
}

export default Sidebar