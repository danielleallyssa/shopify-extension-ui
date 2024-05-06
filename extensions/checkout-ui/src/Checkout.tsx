import { useEffect, useState } from "react";
import {
  useApi,
  useTranslate,
  reactExtension,
  InlineLayout,
  Text,
  Image,
  Checkbox,
  BlockStack,
  Pressable,
  Heading,
  BlockSpacer,
  Divider,
  useCartLines,
  useApplyCartLinesChange,
  useSettings,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension(
  "purchase.checkout.cart-line-list.render-after",
  () => <Extension />
);

// const variantId = "gid://shopify/ProductVariant/42768847339660";

interface VariantData {
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  image?: {
    url: string;
    altText: string;
  };
  product: {
    title: string;
    featuredImage?: {
      url: string;
      altText: string;
    };
  };
}

function Extension() {
  const { query } = useApi();

  const [variantData, setVariant] = useState<null | VariantData>(null);
  const [isSelected, setIsSelected] = useState(false);

  const cartLines = useCartLines();
  const applyCartLineChange = useApplyCartLinesChange();

  const settings = useSettings();
  const variantId = settings.selected_variant as string;

  useEffect(() => {
    async function getVariantData() {
      const queryResult = await query<{ node: VariantData }>(`{
        node(id:"${variantId}"){
          ... on ProductVariant {
            title
            price {
              amount
              currencyCode
            }
            image {
              url
              altText
            }
            product {
              title
              featuredImage{
                url
                altText
              }
            }
          }
        }
      }`);

      // console.log(queryResult);
      if (queryResult.data) {
        setVariant(queryResult.data.node);
      }
    }

    if (variantId) {
      getVariantData();
    }
  }, []);

  useEffect(() => {
    if (isSelected) {
      applyCartLineChange({
        type: "addCartLine",
        quantity: 1,
        merchandiseId: variantId,
      });
    } else {
      const cartLineId = cartLines.find(
        (cartLine) => cartLine.merchandise.id === variantId
      )?.id;

      if (cartLineId) {
        applyCartLineChange({
          type: "removeCartLine",
          quantity: 1,
          id: cartLineId,
        });
      }
    }
  }, [isSelected]);

  if (!variantId || !variantData) return null;

  return (
    <>
      <Divider />
      <BlockSpacer spacing={"base"} />
      <Heading level={2}>Other Products You May Like</Heading>
      <BlockSpacer spacing={"base"} />
      <Pressable onPress={() => setIsSelected(!isSelected)}>
        <InlineLayout
          blockAlignment="center"
          spacing={["base", "base"]}
          columns={["auto", 80, "fill"]}
          padding="base"
        >
          <Checkbox checked={isSelected} />
          <Image
            source={
              variantData.image?.url || variantData.product.featuredImage?.url
            }
            accessibilityDescription={
              variantData.image?.altText ||
              variantData.product.featuredImage?.altText
            }
            borderRadius="base"
            border={"base"}
            borderWidth={"base"}
          />
          <BlockStack>
            <Text>
              {variantData.product.title} - {variantData.title}
            </Text>
            <Text>
              {variantData.price.amount} {variantData.price.currencyCode}
            </Text>
          </BlockStack>
        </InlineLayout>
      </Pressable>
    </>
  );
}
