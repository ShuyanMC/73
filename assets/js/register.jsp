/**
 * 用户登陆
 *TODO
 *LIU
 * @param request
 * @param response
 * @return ModelAndView
 *下午2:50:51
 */
@RequestMapping("/login1.action")
@ResponseBody
public Object login1(HttpServletRequest request, HttpServletResponse response) {
	
	// 将用户名和密码保存到user
	
	User user = new User();
	user.setUserId(request.getParameter("uname"));
	user.setPassword(request.getParameter("pwd"));
	
	String flag = "false";
	// 判断登陆是否成功
	if(userService.login(user)){
		flag = "true";
		
	}else{
		flag = "false";
	}
	
	return flag;
}

————————————————

                            版权声明：本文为博主原创文章，遵循 CC 4.0 BY-SA 版权协议，转载请附上原文出处链接和本声明。
                        
原文链接：https://blog.csdn.net/niceLiuSir/article/details/78473635