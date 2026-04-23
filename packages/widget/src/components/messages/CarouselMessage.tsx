/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState } from "react";

import { Button, UiMessage } from "../../types/message.types";
import { processContent } from "../../utils/text";

import ButtonsMessage from "./ButtonMessage";
import "./CarouselMessage.scss";

interface Element {
  title: string;
  subtitle?: string;
  image_url?: string;
  buttons?: Button[];
}

type CarouselItemProps = {
  message: Element;
};

const CarouselItem: React.FC<CarouselItemProps> = ({ message }) => (
  <div className="hb-message--carousel-element-wrapper">
    <div className="hb-message--carousel-element">
      {message.image_url && (
        <div
          className="hb-message--carousel-element-image"
          style={{ backgroundImage: `url('${message.image_url}')` }}
        />
      )}
      <div className="hb-message--carousel-element-description">
        <h3 className="hb-message--carousel-title">{message.title}</h3>
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
          message={{ data: { buttons: message.buttons } }}
        />
      )}
    </div>
  </div>
);

interface CarouselMessageProps {
  messageCarousel: UiMessage;
}

const CarouselMessage: React.FC<CarouselMessageProps> = ({
  messageCarousel,
}) => {
  if (!("elements" in messageCarousel.data)) {
    throw new Error("Unable to find carousel elements");
  }

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
  const shouldDisplayNavigationButtons = items.length > 1;

  return (
    <div
      className={`hb-message--carousel ${messageCarousel.direction || "received"}`}
    >
      <div
        className="hb-message--carousel-inner"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {items.map((message, idx) => (
          <CarouselItem key={idx} message={message} />
        ))}
      </div>
      {shouldDisplayNavigationButtons && (
        <>
          <button
            type="button"
            className="hb-message--carousel-control prev"
            onClick={goToPrevious}
            aria-label="Previous slide"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            className="hb-message--carousel-control next"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <ChevronRight />
          </button>
        </>
      )}
    </div>
  );
};

export default CarouselMessage;
