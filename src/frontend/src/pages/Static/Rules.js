import React from 'react';
import { Link } from 'react-router-dom';

const Rules = () => {
  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <i className="fas fa-gavel me-2"></i>
                Quy tắc & Điều khoản sử dụng
              </h4>
            </div>
            <div className="card-body">
              <div className="rules-content">
                <section className="mb-5">
                  <h5 className="text-primary border-bottom pb-2">
                    <i className="fas fa-info-circle me-2"></i>
                    1. Giới thiệu
                  </h5>
                  <p>
                    Chào mừng bạn đến với Diễn đàn Tin học! Đây là nơi để cộng đồng lập trình viên 
                    và những người yêu thích công nghệ thông tin chia sẻ kiến thức, học hỏi và kết nối.
                  </p>
                  <p>
                    Bằng việc sử dụng diễn đàn, bạn đồng ý tuân thủ các quy tắc và điều khoản dưới đây.
                  </p>
                </section>

                <section className="mb-5">
                  <h5 className="text-primary border-bottom pb-2">
                    <i className="fas fa-user-check me-2"></i>
                    2. Quy tắc về tài khoản
                  </h5>
                  <ul>
                    <li>Mỗi người chỉ được đăng ký một tài khoản duy nhất.</li>
                    <li>Tên người dùng và tên hiển thị phải phù hợp, không vi phạm thuần phong mỹ tục.</li>
                    <li>Không được mạo danh người khác hoặc tổ chức.</li>
                    <li>Bảo mật thông tin đăng nhập của bạn, không chia sẻ cho người khác.</li>
                    <li>Chịu trách nhiệm về mọi hoạt động trên tài khoản của mình.</li>
                  </ul>
                </section>

                <section className="mb-5">
                  <h5 className="text-primary border-bottom pb-2">
                    <i className="fas fa-file-alt me-2"></i>
                    3. Quy tắc đăng bài viết
                  </h5>
                  <ul>
                    <li>Bài viết phải liên quan đến lĩnh vực tin học, công nghệ thông tin.</li>
                    <li>Tiêu đề bài viết phải rõ ràng, mô tả đúng nội dung.</li>
                    <li>Chọn đúng danh mục cho bài viết.</li>
                    <li>Không đăng nội dung trùng lặp hoặc spam.</li>
                    <li>Trích dẫn nguồn khi sử dụng nội dung của người khác.</li>
                    <li>Không đăng nội dung vi phạm bản quyền.</li>
                  </ul>
                </section>

                <section className="mb-5">
                  <h5 className="text-primary border-bottom pb-2">
                    <i className="fas fa-comments me-2"></i>
                    4. Quy tắc bình luận
                  </h5>
                  <ul>
                    <li>Bình luận phải liên quan đến nội dung bài viết.</li>
                    <li>Tôn trọng ý kiến của người khác, tranh luận văn minh.</li>
                    <li>Không spam, quảng cáo trong bình luận.</li>
                    <li>Không sử dụng ngôn từ thô tục, xúc phạm.</li>
                  </ul>
                </section>

                <section className="mb-5">
                  <h5 className="text-primary border-bottom pb-2">
                    <i className="fas fa-ban me-2"></i>
                    5. Nội dung bị cấm
                  </h5>
                  <div className="alert alert-danger">
                    <ul className="mb-0">
                      <li>Nội dung khiêu dâm, đồi trụy.</li>
                      <li>Nội dung bạo lực, kích động thù địch.</li>
                      <li>Nội dung phân biệt chủng tộc, giới tính, tôn giáo.</li>
                      <li>Thông tin cá nhân của người khác mà không có sự đồng ý.</li>
                      <li>Mã độc, virus, phần mềm có hại.</li>
                      <li>Hướng dẫn hack, crack phần mềm trái phép.</li>
                      <li>Quảng cáo, spam, lừa đảo.</li>
                      <li>Nội dung vi phạm pháp luật Việt Nam.</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-5">
                  <h5 className="text-primary border-bottom pb-2">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    6. Hình thức xử lý vi phạm
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>Mức độ</th>
                          <th>Vi phạm</th>
                          <th>Hình thức xử lý</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><span className="badge bg-warning">Nhẹ</span></td>
                          <td>Spam, off-topic, tiêu đề không rõ ràng</td>
                          <td>Cảnh cáo, xóa nội dung</td>
                        </tr>
                        <tr>
                          <td><span className="badge bg-orange" style={{backgroundColor: '#fd7e14'}}>Trung bình</span></td>
                          <td>Xúc phạm người khác, quảng cáo</td>
                          <td>Cấm đăng bài 1-7 ngày</td>
                        </tr>
                        <tr>
                          <td><span className="badge bg-danger">Nặng</span></td>
                          <td>Nội dung cấm, vi phạm pháp luật</td>
                          <td>Cấm tài khoản vĩnh viễn</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="mb-5">
                  <h5 className="text-primary border-bottom pb-2">
                    <i className="fas fa-flag me-2"></i>
                    7. Báo cáo vi phạm
                  </h5>
                  <p>
                    Nếu bạn phát hiện nội dung vi phạm quy tắc, vui lòng sử dụng nút 
                    <span className="badge bg-danger mx-1">
                      <i className="fas fa-flag me-1"></i>Báo cáo
                    </span>
                    để thông báo cho quản trị viên.
                  </p>
                  <p>
                    <strong>Lưu ý:</strong> Báo cáo sai sự thật nhiều lần có thể dẫn đến việc 
                    bị cấm quyền báo cáo.
                  </p>
                </section>

                <section className="mb-5">
                  <h5 className="text-primary border-bottom pb-2">
                    <i className="fas fa-shield-alt me-2"></i>
                    8. Quyền riêng tư
                  </h5>
                  <ul>
                    <li>Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn.</li>
                    <li>Thông tin email chỉ dùng để xác thực và thông báo quan trọng.</li>
                    <li>Không chia sẻ thông tin cá nhân cho bên thứ ba.</li>
                    <li>Bạn có quyền yêu cầu xóa tài khoản và dữ liệu cá nhân.</li>
                  </ul>
                </section>

                <section className="mb-4">
                  <h5 className="text-primary border-bottom pb-2">
                    <i className="fas fa-sync-alt me-2"></i>
                    9. Thay đổi quy tắc
                  </h5>
                  <p>
                    Quy tắc có thể được cập nhật theo thời gian. Chúng tôi sẽ thông báo 
                    khi có thay đổi quan trọng. Việc tiếp tục sử dụng diễn đàn đồng nghĩa 
                    với việc bạn chấp nhận các quy tắc mới.
                  </p>
                  <p className="text-muted">
                    <small>Cập nhật lần cuối: Tháng 12, 2024</small>
                  </p>
                </section>

                <div className="text-center mt-5 pt-4 border-top">
                  <p className="mb-3">Bạn có câu hỏi về quy tắc?</p>
                  <Link to="/contact" className="btn btn-primary">
                    <i className="fas fa-envelope me-2"></i>
                    Liên hệ với chúng tôi
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rules;
