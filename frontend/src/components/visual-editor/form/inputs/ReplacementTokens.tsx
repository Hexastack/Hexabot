/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";

import { useFind } from "@/hooks/crud/useFind";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";

function ReplacementTokens() {
  const { t } = useTranslate();
  const userInfos = [
    { name: "first_name", label: t("label.user_first_name") },
    { name: "last_name", label: t("label.user_last_name") },
  ];
  const userLocation = [
    { name: "lat", label: t("label.user_location_lat") },
    { name: "lon", label: t("label.user_location_lon") },
    { name: "address.country", label: t("label.user_location_country") },
    { name: "address.state", label: t("label.user_location_state") },
    { name: "address.zipcode", label: t("label.user_location_zipcode") },
    { name: "address.streetName", label: t("label.user_location_streetName") },
  ];
  // React Query to fetch context variables
  const { data: contextVars } = useFind({
    entity: EntityType.CONTEXT_VAR,
  });
  // React Query to fetch contact information
  const { data: contactInfos } = useFind(
    {
      entity: EntityType.SETTING,
    },
    {
      params: {
        where: {
          group: "contact",
        },
      },
      hasCount: false,
    },
  );

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        {t("label.replacement_tokens")}
      </AccordionSummary>
      <AccordionDetails sx={{ maxHeight: "600px", overflowY: "scroll" }}>
        <Typography variant="h6">{t("title.context_vars")}</Typography>
        <List>
          {(contextVars || []).map((v, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={`{{context.vars.${v.name}}}`}
                secondary={`${v.label}`}
              />
            </ListItem>
          ))}
        </List>
        <Typography variant="h6">{t("title.user_infos")}</Typography>
        <List>
          {userInfos.map((v, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={`{{context.user.${v.name}}}`}
                secondary={`${v.label}`}
              />
            </ListItem>
          ))}
        </List>
        <Typography variant="h6">{t("title.user_location")}</Typography>
        <List>
          {userLocation.map((v, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={`{{context.user_location.${v.name}}}`}
                secondary={`${v.label}`}
              />
            </ListItem>
          ))}
        </List>
        <Typography variant="h6">
          {t("title.contact", { ns: "contact" })}
        </Typography>
        <List>
          {(contactInfos || []).map((v, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={`{{contact.${v.label}}}`}
                secondary={t(`label.${v.label}`, {
                  ns: "contact",
                })}
              />
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}

ReplacementTokens.displayName = "ReplacementTokens";

export default ReplacementTokens;
