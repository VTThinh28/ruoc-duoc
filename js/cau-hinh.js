/* Cấu hình Firebase cho bản trên GitHub Pages (điện thoại nói chuyện với TV).
   Realtime Database chỉ cần địa chỉ cơ sở dữ liệu, nên không đưa apiKey lên kho công khai.
   Để null thì trang chỉ nối được các cửa sổ trên cùng một máy.
   Trong Claude không dùng file này: Claude tự nối hai máy. */
window.RD_FIREBASE = {
  databaseURL: "https://my-project-1473334284611-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "my-project-1473334284611"
};
