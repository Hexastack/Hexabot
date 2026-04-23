/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  AnyButton as ButtonType,
  OutgoingPopulatedListMessage,
  StdOutgoingListMessage,
} from "@hexabot-ai/types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { alpha, styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

import { useGetAttachmentMetadata } from "@/hooks/useGetAttachmentMetadata";

const CARD_WIDTH = 300;
const CARD_GAP_PX = 10;
const CARD_PREVIEW_WIDTH = 225;
const CAROUSEL_WRAPPER_CLASSNAME = "inbox-carousel-wrapper";
const StyledIconButton = styled(IconButton)(({ theme }) => ({
  opacity: 0.2,
  zIndex: 2,
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  transition: theme.transitions.create(["opacity", "background-color"], {
    duration: theme.transitions.duration.shortest,
  }),
  [`.${CAROUSEL_WRAPPER_CLASSNAME}:hover &`]: {
    opacity: 1,
  },
  backgroundColor: alpha(theme.palette.background.paper, 0.9),
  color: (theme.vars || theme).palette.text.primary,
  border: `1px solid ${(theme.vars || theme).palette.divider}`,
  "&:hover": {
    backgroundColor: (theme.vars || theme).palette.background.paper,
  },
}));
const StyledCarouselDiv = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  scrollSnapType: "x mandatory",
  overflowX: "scroll",
  width: CARD_WIDTH,
  justifyContent: "flex-start",
  gap: CARD_GAP_PX,
  padding: theme.spacing(0.25, 0),
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
  [`.${CAROUSEL_WRAPPER_CLASSNAME}:hover .shadow`]: {
    transform: "translate(0px)",
  },
}));
const ShadowDiv = styled("div")(({ theme }) => ({
  position: "absolute",
  top: 0,
  height: "100%",
  width: 10,
  zIndex: 1,
  transition: theme.transitions.create(["opacity", "transform"], {
    duration: theme.transitions.duration.shortest,
  }),
  [`.${CAROUSEL_WRAPPER_CLASSNAME}:hover &`]: {
    transform: "translate(0px)",
  },
}));
const Shadow = (
  props: { left: boolean; visible: boolean } = { left: false, visible: false },
) => (
  <ShadowDiv
    className={`shadow ${props.left ? "shadow-left" : "shadow-right"}`}
    sx={(theme) => ({
      left: props.left ? 0 : "auto",
      right: props.left ? "auto" : 0,
      background: `radial-gradient(ellipse at ${
        props.left ? "0%" : "100%"
      } 50%, ${alpha(theme.palette.text.primary, 0.35)} 0%, ${alpha(
        theme.palette.text.primary,
        0,
      )} 80%)`,
      opacity: props.visible ? 1 : 0,
      transform: `translate(${props.left ? "-10px" : "10px"})`,
    })}
  />
);

export const Carousel = (props: StdOutgoingListMessage) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTo, setScrollTo] = useState<number>(0);
  const incrementScroll = () => {
    setScrollTo((current) =>
      current + 1 >= props.elements.length
        ? props.elements.length - 1
        : current + 1,
    );
  };
  const decrementScroll = () => {
    setScrollTo((current) => Math.max(current - 1, 0));
  };
  const handleScrollEnd = useCallback(function (
    this: HTMLDivElement,
    _: Event,
  ) {
    setScrollTo(Math.floor(this.scrollLeft / CARD_WIDTH));
  }, []);

  useEffect(() => {
    ref.current?.addEventListener("scrollend", handleScrollEnd, {
      passive: true,
    });

    return () => ref.current?.removeEventListener("scrollend", handleScrollEnd);
  }, [handleScrollEnd]);

  useEffect(() => {
    ref.current?.scrollTo({
      behavior: "smooth",
      left: CARD_WIDTH * scrollTo + Math.max(CARD_GAP_PX * (scrollTo - 1), 0),
      top: 0,
    });
  }, [props.elements, scrollTo]);

  return (
    <Box
      className={CAROUSEL_WRAPPER_CLASSNAME}
      sx={{
        width: CARD_WIDTH,
        maxWidth: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <StyledCarouselDiv ref={ref}>
        {props.elements.map((element) => (
          <ListCard
            buttons={props.options.buttons}
            content={
              Object.fromEntries(
                Object.entries(props.options.fields).map(
                  ([key, value]) => [key, element[value as string]] as const,
                ),
              ) as OutgoingPopulatedListMessage
            }
            key={element.id}
            id={element.id}
          />
        ))}
      </StyledCarouselDiv>

      <StyledIconButton
        sx={{
          left: 0.5,
          visibility: scrollTo === 0 ? "hidden" : "visible",
        }}
        onClick={decrementScroll}
      >
        <ChevronLeft size={20} />
      </StyledIconButton>

      <StyledIconButton
        sx={{
          right: 0.5,
          visibility:
            scrollTo === props.elements.length - 1 ? "hidden" : "visible",
        }}
        onClick={incrementScroll}
      >
        <ChevronRight size={20} />
      </StyledIconButton>

      <Shadow left visible={scrollTo !== 0} />
      <Shadow left={false} visible={scrollTo !== props.elements.length - 1} />
    </Box>
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
      ref={ref}
      id={`A${props.id}`}
      variant="outlined"
      sx={{
        width: CARD_PREVIEW_WIDTH,
        flexShrink: 0,
        flexBasis: CARD_WIDTH,
        scrollSnapAlign: "start",
        p: 0,
        gap: 0,
        borderRadius: 1.5,
        bgcolor: "background.paper",
      }}
    >
      {metadata ? (
        <CardMedia
          image={metadata.url}
          sx={{ height: 185 }}
          title={props.content.title}
        />
      ) : null}

      <CardContent
        sx={{
          px: 1.5,
          pt: 1.5,
          pb: 1,
        }}
      >
        <Typography gutterBottom variant="subtitle1" component="div">
          {props.content.title}
        </Typography>
        <Typography
          sx={{
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
      <CardActions sx={{ px: 1.5, pb: 1.5, pt: 0 }}>
        <Stack direction="column" spacing={0.75} width="100%">
          {props.buttons.map((button) => (
            <Button
              variant="contained"
              sx={{ width: "100%" }}
              disabled
              key={button.title}
            >
              {button.title}
            </Button>
          ))}
        </Stack>
      </CardActions>
    </Card>
  );
});
