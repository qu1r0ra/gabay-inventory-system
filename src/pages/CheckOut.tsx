// ! Blank

import ConfirmItems from "../components/ConfirmationForm";



const sampleItems = [
  { 
    id: '1', 
    name: 'Bandage', 
    expiration: '2024-12-25', 
    quantity: 5,
    imageUrl: '' 
  },
  { 
    id: '2', 
    name: 'Alcohol WIpes', 
    expiration: '2024-12-20', 
    quantity: 2 
  },
  { 
    id: '3', 
    name: 'Gauze Pads', 
    expiration: '2024-12-18', 
    quantity: 3 
  },
  { 
    id: '4', 
    name: 'Surgical Gloves', 
    expiration: '2024-12-22', 
    quantity: 1 
  },
  { 
    id: '5', 
    name: 'Antibiotic Ointment', 
    expiration: '2024-12-30', 
    quantity: 4 
  },
  { 
    id: '6', 
    name: 'Thermometer', 
    expiration: '2025-03-15', 
    quantity: 2 
  }
];

function CheckOut() {
  return (
    <>
      <ConfirmItems items={sampleItems} />
    </>
  );
}

export default CheckOut;
