/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React, { useState } from "react";

import { useColors } from "../../providers/ColorProvider";
import { Direction, TButton, TMessage } from "../../types/message.types";
import { processContent } from "../../utils/text";

import ButtonsMessage from "./ButtonMessage";
import "./CarouselMessage.scss";

interface Element {
  title: string;
  subtitle?: string;
  image_url?: string;
  buttons?: TButton[];
}

interface MessageCarousel {
  direction?: Direction;
  data: {
    elements: Element[];
  };
}

type CarouselItemProps = {
  message: Element;
  idx: number;
};

const CarouselItem: React.FC<CarouselItemProps> = ({ message }) => (
  <div className="sc-message--carousel-element-wrapper">
    <div className="sc-message--carousel-element">
      {message.image_url && (
        <div
          className="sc-message--carousel-element-image"
          style={{ backgroundImage: `url('${message.image_url}')` }}
        />
      )}
      <div className="sc-message--carousel-element-description">
        <h3 className="sc-message--carousel-title">{message.title}</h3>
        {message.subtitle && (
          <p
            dangerouslySetInnerHTML={{
              __html: processContent(message.subtitle),
            }}
          />
        )}
      </div>
      {message.buttons && (
        <ButtonsMessage
          message={{ data: { buttons: message.buttons } } as TMessage}
        />
      )}
    </div>
  </div>
);

interface CarouselMessageProps {
  messageCarousel: MessageCarousel;
}

const CarouselMessage: React.FC<CarouselMessageProps> = ({
  messageCarousel,
}) => {
  const { colors: allColors } = useColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const items = messageCarousel.data.elements;
  const goToPrevious = () => {
    setActiveIndex(
      (prevIndex) => (prevIndex + items.length - 1) % items.length,
    );
  };
  const goToNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % items.length);
  };
  const colors = allColors[messageCarousel.direction || "received"];
  const shouldDisplayNavigationButtons = items.length > 1;

  return (
    <div
      className="sc-message--carousel"
      style={{
        color: colors.text,
        backgroundColor: colors.bg,
      }}
    >
      <div
        className="sc-message--carousel-inner"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {items.map((message, idx) => (
          <CarouselItem key={idx} message={message} idx={idx} />
        ))}
      </div>
      {shouldDisplayNavigationButtons && (
        <>
          <button
            className="sc-message--carousel-control prev"
            onClick={goToPrevious}
          >
            &#10094;
          </button>
          <button
            className="sc-message--carousel-control next"
            onClick={goToNext}
          >
            &#10095;
          </button>
        </>
      )}
    </div>
  );
};

export default CarouselMessage;
