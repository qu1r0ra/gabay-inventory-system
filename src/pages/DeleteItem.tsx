import ItemForm from "../components/ItemForm";

function DeleteItem() {
  return (
    <div className="flex mt-8 mx-2 min-h-screen flex-col items-center">
      <ItemForm mode="delete" />
    </div>
  );
}

export default DeleteItem;
