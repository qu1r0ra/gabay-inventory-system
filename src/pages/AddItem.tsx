import ItemForm from "../components/ItemForm";

function AddItem() {
  return (
    <div className="flex justify-center min-h-screen flex-col items-center">
      <ItemForm mode="add" />
    </div>
  );
}

export default AddItem;
