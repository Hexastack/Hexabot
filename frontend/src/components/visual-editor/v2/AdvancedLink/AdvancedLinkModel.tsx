import {
  DefaultLinkModel,
  DefaultLinkModelOptions,
} from "@projectstorm/react-diagrams";

export class AdvancedLinkModel extends DefaultLinkModel {
  constructor(options?: DefaultLinkModelOptions) {
    super({
      ...options,
      type: "advanced",
    });
  }
}
