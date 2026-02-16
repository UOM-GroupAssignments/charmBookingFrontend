import { Card, CardHeader, CardBody, Image } from '@heroui/react'
import logger from '../../utils/logger'

interface ProductCardProps {
  product: {
    name: string
    price: number
    rating: number
    image: string
  }
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <Card className='py-4' isPressable shadow='sm' onPress={() => logger.debug('item pressed')}>
      <CardHeader className='pb-0 pt-2 px-4 flex-col items-start'>
        <Image alt={product.name} className='object-cover rounded-xl' src={product.image} />
      </CardHeader>
      <CardBody className='overflow-visible py-2 px-5'>
        <h4 className='font-bold text-large'>{product.name}</h4>
        <p className='text-tiny'>RS. {product.price.toFixed(2)}</p>
        <small className='text-default-500'>{product.rating}</small>
      </CardBody>
    </Card>
  )
}

export default ProductCard
