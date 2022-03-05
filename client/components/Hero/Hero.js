import React from 'react';
import { GoBeaker } from 'react-icons/go';
import { HeroContainer, LogoContainer, Greeting} from './Hero.styled'


const Hero = () => {
  return (
    <>
      <HeroContainer>
        <LogoContainer>
          <GoBeaker />
        </LogoContainer>
      </HeroContainer>
    </>
  );
};

export default Hero