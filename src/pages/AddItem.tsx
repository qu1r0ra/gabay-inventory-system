import ItemForm from "../components/ItemForm";

function AddItem() {
  return (
    <div className="flex mt-8 mx-2 min-h-screen flex-col items-center">
      <ItemForm mode="add" />
    </div>
  );
}

export default AddItem;
