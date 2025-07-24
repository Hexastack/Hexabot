/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  IconButton,
  styled,
  Typography,
} from "@mui/material";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

import { useGetAttachmentMetadata } from "@/hooks/useGetAttachmentMetadata";
import {
  AnyButton as ButtonType,
  OutgoingPopulatedListMessage,
  StdOutgoingListMessage,
} from "@/types/message.types";

const CARD_WIDTH = 300;
const StyledIconButton = styled(IconButton)({
  opacity: 0.2,
  zIndex: 9999,
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  transition: "all 0.1s",
  ".carousel-wrapper:hover &": {
    opacity: 1,
    backgroundColor: "#fff",
  },
  backgroundColor: "#fff",
});
const StyledCarouselDiv = styled("div")({
  display: "flex",
  flexDirection: "row",
  scrollSnapType: "x mandatory",
  overflowX: "scroll",
  width: `${CARD_WIDTH}px`,
  justifyContent: "start",
  gap: "10px",
  padding: "2px 0px",
  position: "relative",

  msOverflowStyle: "none",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": {
    display: "none",
  },
  ".shadow-left": {
    transform: "translate(-10px)",
  },
  ".shadow-right": {
    transform: "translate(10px)",
  },
  ".carousel-wrapper:hover .shadow": {
    transform: "translate(0px)",
  },
});
const ShadowDiv = styled("div")({
  position: "absolute",
  top: "0",
  height: "100%",
  width: "10px",
  zIndex: 9998,
  transition: "all 0.5s",
  ".carousel-wrapper:hover &": {
    transform: "translate(0px)",
  },
});
const Shadow = (
  props: { left: boolean; visible: boolean } = { left: false, visible: false },
) => (
  <ShadowDiv
    sx={{
      left: props.left ? "0" : "auto",
      right: props.left ? "auto" : "0",
      background: `radial-gradient(ellipse at ${
        props.left ? "0%" : "100%"
      } 50%, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 80%)`,
      opacity: props.visible ? 1 : 0,
      transform: `translate(${props.left ? "-10px" : "10px"})`,
    }}
  />
);

export const Carousel = (props: StdOutgoingListMessage) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTo, setScrollTo] = useState<number>(0);
  const incrementScroll = () => {
    setScrollTo((scrollTo) => {
      return scrollTo + 1 >= props.elements.length
        ? props.elements.length - 1
        : scrollTo + 1;
    });
  };
  const decrementScroll = () => {
    setScrollTo((sc) => {
      return Math.max(sc - 1, 0);
    });
  };
  const handleScrollEnd = useCallback(function (
    this: HTMLDivElement,
    _: Event,
  ) {
    setScrollTo(Math.floor(this.scrollLeft / CARD_WIDTH));
  },
  []);

  useEffect(() => {
    ref.current?.addEventListener("scrollend", handleScrollEnd, {
      passive: true,
    });
  }, [handleScrollEnd]);

  useEffect(() => {
    ref.current?.scrollTo({
      behavior: "smooth",
      left: CARD_WIDTH * scrollTo + Math.max(10 * (scrollTo - 1), 0),
      top: 0,
    });
  }, [props.elements, scrollTo]);

  return (
    <div
      style={{
        width: `${CARD_WIDTH}px`,
        overflow: "hidden",
        position: "relative",
      }}
      className="carousel-wrapper"
    >
      <StyledCarouselDiv ref={ref}>
        {props.elements.map((e) => (
          <ListCard
            buttons={props.options.buttons}
            content={
              Object.fromEntries(
                Object.entries(props.options.fields).map(
                  ([k, v]) => [k, e[v as string]] as const,
                ),
              ) as OutgoingPopulatedListMessage
            }
            key={e.id}
            id={e.id}
          />
        ))}
      </StyledCarouselDiv>
      <StyledIconButton
        sx={{
          left: "5px",
          visibility: scrollTo === 0 ? "hidden" : "visible",
        }}
        onClick={decrementScroll}
      >
        <ArrowBackIosNewIcon />
      </StyledIconButton>

      <StyledIconButton
        sx={{
          right: "5px",
          visibility:
            scrollTo === props.elements.length - 1 ? "hidden" : "visible",
        }}
        onClick={incrementScroll}
      >
        <ArrowForwardIosIcon />
      </StyledIconButton>

      <Shadow left visible={scrollTo !== 0} />
      <Shadow left={false} visible={scrollTo !== props.elements.length - 1} />
    </div>
  );
};

const ListCard = forwardRef<
  HTMLDivElement,
  {
    id: string;
    content: OutgoingPopulatedListMessage;
    buttons: ButtonType[];
  }
>(function ListCardRef(props, ref) {
  const metadata = useGetAttachmentMetadata(props.content.image_url?.payload);

  return (
    <Card
      style={{
        width: 225,
        flexShrink: "0",
        flexBasis: CARD_WIDTH,
        scrollSnapAlign: "start",
        borderRadius: 5,
        backgroundColor: "white",
      }}
      ref={ref}
      id={"A" + props.id}
    >
      {metadata ? (
        <CardMedia
          image={metadata.url}
          sx={{ height: "185px" }}
          title={props.content.title}
        />
      ) : null}

      <CardContent
        sx={{
          flexDirection: "column",
          marginBottom: "0px",
        }}
      >
        <Typography gutterBottom variant="h5" component="div">
          {props.content.title}
        </Typography>
        <Typography
          sx={{
            // height: "10ex",
            textOverflow: "ellipsis",
            overflow: "hidden",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            display: "-webkit-box",
          }}
          variant="body2"
          color="text.secondary"
        >
          {props.content.subtitle}
        </Typography>
      </CardContent>
      <CardActions>
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          {props.buttons.map((b) => (
            <Button
              variant="contained"
              sx={{ width: "100%" }}
              disabled
              key={b.title}
            >
              {b.title}
            </Button>
          ))}
        </div>
      </CardActions>
    </Card>
  );
});
