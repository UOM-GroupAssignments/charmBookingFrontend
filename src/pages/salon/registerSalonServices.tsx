import { faChevronLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logger from '../../utils/logger'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
} from '@heroui/react'

const RegisterSalonServices = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<string[]>([])
  const [newService, setNewService] = useState({
    category: '',
    serviceName: '',
    duration: '',
    buffer: '',
    price: '',
  })
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  //get categories from backend
  const fetchCategories = async () => {
    try {
      const response = await fetch('/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      logger.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCategorySelect = (category: string) => {
    logger.debug('Selected category:', category)
    // Handle category selection logic here
  }

  const handleAddService = () => {
    // Add your logic to save the service
    logger.debug('New service:', newService)
    closeModal()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewService(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div>
      <div
        className='flex flex-row items-center ml-10 mt-10 gap-3 cursor-pointer'
        onClick={() => navigate(-1)}
      >
        <FontAwesomeIcon icon={faChevronLeft} size='2x' className='self-center' />
        <div className='text-2xl font-medium'>For Booking</div>
      </div>
      <div className='flex flex-row items-center m-5 gap-5'>
        <div className='flex-col items-center w-1/2'>
          <Dropdown>
            <DropdownTrigger>
              <Button variant='solid' color='primary'>
                Select a Category
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              {categories.map(category => (
                <DropdownItem key={category} onClick={() => handleCategorySelect(category)}>
                  {category}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
        <div className='flex-col items-center w-1/2'>
          <Button variant='solid' color='secondary' onPress={() => openModal()}>
            Add Service
          </Button>
          <Modal isOpen={isModalOpen} onClose={closeModal}>
            <ModalContent>
              <ModalHeader>Add New Service</ModalHeader>
              <ModalBody>
                <div className='space-y-4'>
                  <Select
                    label='Category'
                    name='category'
                    onChange={e => setNewService({ ...newService, category: e.target.value })}
                  >
                    {categories.map(category => (
                      <SelectItem key={category}>{category}</SelectItem>
                    ))}
                  </Select>

                  <Input
                    label='Service Name'
                    name='serviceName'
                    placeholder='Enter service name'
                    onChange={handleInputChange}
                  />

                  <Input
                    label='Duration (minutes)'
                    name='duration'
                    type='number'
                    placeholder='Enter duration'
                    onChange={handleInputChange}
                  />

                  <Input
                    label='Buffer Time (minutes)'
                    name='buffer'
                    type='number'
                    placeholder='Enter buffer time'
                    onChange={handleInputChange}
                  />

                  <Input
                    label='Price ($)'
                    name='price'
                    type='number'
                    placeholder='Enter price'
                    onChange={handleInputChange}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color='danger' variant='light' onPress={closeModal}>
                  Cancel
                </Button>
                <Button color='primary' onPress={handleAddService}>
                  Add Service
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      </div>
    </div>
  )
}

export default RegisterSalonServices
