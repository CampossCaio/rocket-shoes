import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get<Stock>(`stock/${productId}`);

      const productStock = response.data.amount;

      const checkProductIndex = cart.findIndex(
        (product) => product.id === productId
      );

      if (checkProductIndex === -1) {
        const response = await api.get(`products/${productId}`);

        const product = {
          ...response.data,
          amount: 1,
        };

        const newCart = [...cart, product];
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      } else {
        if (cart[checkProductIndex].amount + 1 > productStock) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }

        cart[checkProductIndex].amount++;
        setCart([...cart]);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const checkIfProductExists = cart.find(
        (product) => product.id === productId
      );

      if (!checkIfProductExists) {
        return toast.error("Erro na remoção do produto");
      }

      const filteredCart = cart.filter((product) => product.id !== productId);

      setCart(filteredCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(filteredCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const response = await api.get<Stock>(`stock/${productId}`);
      const productStock = response.data.amount;

      if (!productStock) {
        return;
      }

      const productIndex = cart.findIndex(
        (product) => product.id === productId
      );

      if (amount <= 0) {
        return;
      }

      if (!(amount <= productStock)) {
        return toast.error("Quantidade solicitada fora de estoque");
      }

      cart[productIndex].amount = amount;

      setCart([...cart]);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
